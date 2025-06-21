import { Canvas, context, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, GizmoHelper, GizmoViewport, useGLTF, Environment, useAnimations, Decal, Plane, Text } from "@react-three/drei";
import { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { InfiniteGridHelper } from "./InfiniteGridHelper";
import * as THREE from "three";
import UserInterface from "./UserInterface";
import StickyNote from "./StickyNote";
import "./App.css";
import { AlignCenter, AlignLeft, AlignRight, ArrowLeft, ArrowRight, Bold, BookOpen, Hand, Italic, PencilLine, RemoveFormatting, RotateCw, TextCursor, X } from "lucide-react";

const InfiniteGrid = ({ size1 = 10, size2 = 100, color = 0x444444, distance = 8000, axes = 'xzy' }) => {
  const gridColor = color instanceof THREE.Color ? color : new THREE.Color(color);

  return (
    <primitive
      object={new InfiniteGridHelper(size1, size2, gridColor, distance, axes)}
    />
  );
};

const NoteBook = ({ url, isOpen, skipInitialAnimation = false}) => {
  const { scene, animations } = useGLTF(url);
  const group = useRef();
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const [currentAction, setCurrentAction] = useState(null);
  const prevIsOpen = useRef(isOpen);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!actions || isInitialized) return;

    const openAction = actions["OpenAction"];
    const closeAction = actions["CloseAction"];
    
    if (openAction && closeAction) {
      if (!isOpen) {
        closeAction.reset();
        closeAction.setLoop(THREE.LoopOnce, 1);
        closeAction.clampWhenFinished = true;
        
        if (skipInitialAnimation) {
          closeAction.time = closeAction.getClip().duration;
          closeAction.paused = true;
        }
        
        closeAction.play();
        
        if (skipInitialAnimation) {
          closeAction.paused = true; 
        }
        
        setCurrentAction(closeAction);
      } else if (!skipInitialAnimation) {
        openAction.reset().setLoop(THREE.LoopOnce, 1).play();
        openAction.clampWhenFinished = true;
        setCurrentAction(openAction);
      }
      
      setIsInitialized(true);
    }
  }, [actions, isOpen, skipInitialAnimation, isInitialized]);

  useEffect(() => {
    if (!actions || !isInitialized || prevIsOpen.current === isOpen) return;

    const newActionName = isOpen ? "OpenAction" : "CloseAction";
    const newAction = actions[newActionName];

    if (currentAction) currentAction.stop();
    newAction.reset().setLoop(THREE.LoopOnce, 1).play();
    newAction.clampWhenFinished = true;
    setCurrentAction(newAction);
    prevIsOpen.current = isOpen;
  }, [isOpen, actions, currentAction, isInitialized]);
  
  return (
    <group
      ref={group}
      position={[0, 0, 0]}
      scale={2}
      rotation={[0, Math.PI, 0]}
    >
      <primitive object={clonedScene} />
    </group>
  )
};

const StickyNoteModel = ({ url, color = '#ffeb3b' }) => {
  const { scene } = useGLTF(url);
  const group = useRef();
  const clonedScene = useRef(scene.clone(true));

  useEffect(() => {
    if (clonedScene.current) {
      clonedScene.current.traverse((node) => {
        if (node.isMesh && node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach((mat) => {
              mat.color = new THREE.Color(color);

              if (mat.roughness !== undefined) mat.roughness = 1.0; // Tam mat yüzey
              if (mat.metalness !== undefined) mat.metalness = 0.0; // Metal özelliği yok
              if (mat.shininess !== undefined) mat.shininess = 0; // Eski materyal tipi için parlaklık sıfır

              if (mat.specular !== undefined) {
                mat.specular = new THREE.Color(0x000000);
              }

              mat.needsUpdate = true;
            });
          }
          else {
            node.material.color = new THREE.Color(color);

            if (node.material.roughness !== undefined) node.material.roughness = 1.0;
            if (node.material.metalness !== undefined) node.material.metalness = 0.0;
            if (node.material.shininess !== undefined) node.material.shininess = 0;

            if (node.material.specular !== undefined) {
              node.material.specular = new THREE.Color(0x000000);
            }

            node.material.needsUpdate = true;
          }
        }
      });
    }
  }, [color]);

  return (
    <group
      ref={group}
      position={[0, 0, -0.11]}
      scale={0.5}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <primitive object={clonedScene.current} />
    </group>
  );
};

const createTextTexture = (text, fontSize, textColor, textAlign = "left", textStyle, fontFamily) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 1024;
  canvas.height = 512;

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = textColor;
  context.font = `${textStyle} ${fontSize}px ${fontFamily}`;
  context.textAlign = textAlign;
  context.textBaseline = 'middle';

  const lines = text.split('\n');
  const lineHeight = fontSize * 1.2;
  const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;

  lines.forEach((line, i) => {
    context.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const CubeR = ({ id, position, rotation, onDraggingChange, onRotatingChange, onShowSettings, selectedId, setSelectedId, anyMarkerActive, setAnyMarkerActive, isSelected, onPositionUpdate, onRotationUpdate, pageContexts, setPageContexts, isOpen, setBookOpen, skipInitialAnimation = false }) => {
  const meshRef = useRef();
  const arrowRef = useRef();
  const controlsRef = useRef();
  const isAnimating = useRef(false);
  const animationProgress = useRef(0);
  const [markerActive, setMarkerActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const { camera, gl, controls, raycaster, mouse } = useThree();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 2);
  const startPosition = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const targetMeshPosition = useRef(new THREE.Vector3(...position));
  const targetRotationY = useRef(0);
  const lastMousePosition = useRef(new THREE.Vector3());
  const initialGrabPosition = useRef(new THREE.Vector3());
  const objectInitialPosition = useRef(new THREE.Vector3());
  const [pageVisible, setPageVisible] = useState(false);
  const [animationCooldown, setAnimationCooldown] = useState(false);
  const [planeClickPosition, setPlaneClickPosition] = useState({ x: 0, y: 0 });
  const planeLeftRef = useRef();
  const planeRightRef = useRef();
  const [activePlane, setActivePlane] = useState(null);
  const [leftPage, setLeftPage] = useState(1);
  const [rightPage, setRightPage] = useState(2);
  const [nextContextId, setNextContextId] = useState(1);
  const [showTextInput, setShowTextInput] = useState(false);
  const [tempContextText, setTempContextText] = useState("");
  const [selectedContextId, setSelectedContextId] = useState(null);
  const [fontSize, setFontSize] = useState(20);
  const [textActive, setTextActive] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [textAlign, setTextAlign] = useState("left");
  const [textStyle, setTextStyle] = useState("normal");
  const [planeSide, setPlaneSide] = useState(null);
  const [fontFamily, setFontFamily] = useState('Arial');


  const fontFamilies = [
    'Arial',
    'Courier New',
    'Georgia',
    'Times New Roman',
    'Verdana',
    'Comic Sans MS',
    'Impact',
    'Trebuchet MS',
    'Lucida Console',
    'Tahoma',
    'Helvetica',
    'Palatino Linotype',
    'Garamond',
    'Arial Black',
    'Brush Script MT',
    'Segoe UI',
    'Poppins']

  const toggleOpen = () => {
    if (animationCooldown) return;
    setBookOpen(id,!isOpen);
    setAnimationCooldown(true);
    setTimeout(() => {
      setAnimationCooldown(false);
    }, 1100);
  };
  const focusOnCube = () => {
    if (isAnimating.current) return;
    setSelectedId(null);
    const boxDirection = new THREE.Vector3(0, 1, 0.1);
    boxDirection.applyQuaternion(meshRef.current.quaternion);

    const meshPosition = meshRef.current.position.clone();

    const cameraDistance = 8;
    const cameraTarget = meshPosition.clone().add(boxDirection.clone().multiplyScalar(cameraDistance))

    startPosition.current.copy(camera.position);
    startLookAt.current.copy(controlsRef.current.target);
    targetPosition.current.copy(cameraTarget);
    currentLookAt.current.copy(meshPosition);

    animationProgress.current = 0;
    isAnimating.current = true;

    controls.enabled = false;
    setMarkerActive(true);
  };

  const exitMarker = () => {
    if (isAnimating.current) return;
    setMarkerActive(false);
    setAnyMarkerActive(false);
    setSelectedId(null);
    controls.enabled = true;
    camera.position.copy(startPosition.current);
  }
  useFrame((state, delta) => {
    if (isAnimating.current && markerActive) {
      animationProgress.current += delta * 0.5;

      const progress = Math.min(animationProgress.current, 1);

      const easedProgress = easeInOutCubic(progress);

      camera.position.lerpVectors(startPosition.current, targetPosition.current, easedProgress);
      controlsRef.current.target.lerpVectors(startLookAt.current, currentLookAt.current, easedProgress);

      controlsRef.current.update();

      if (progress >= 1) {
        isAnimating.current = false;
        controls.enabled = false;
      }
    }
    if (meshRef.current && isDragging) {
      const smoothness = 0.15;
      meshRef.current.position.lerp(targetMeshPosition.current, smoothness);
    }
    if (meshRef.current && isRotating) {
      const currentY = meshRef.current.rotation.y;
      const targetY = targetRotationY.current;

      const rotationSmoothness = 0.1;

      let rotationDiff = ((targetY - currentY) % (2 * Math.PI));
      if (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
      if (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;

      meshRef.current.rotation.y += rotationDiff * rotationSmoothness;
    }
  });

  function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  useEffect(() => {
    if (markerActive) {
      setAnyMarkerActive(true);
    }
  }, [markerActive]);

  useEffect(() => {
    if (!markerActive) {
      setTextActive(false);
      setTextAlign("left");
      setTextColor("#000000");
    }
    if (!showTextInput) {
      setTempContextText("");
    }
  }, [markerActive, showTextInput]);
  useEffect(() => {
    if (textActive) {
      document.body.classList.add("text-cursor");
    } else {
      document.body.classList.remove("text-cursor");
    }
  }, [textActive]);
  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        setPageVisible(true);
      }, 1100);
      return () => clearTimeout(timeout);
    }
    else {
      setPageVisible(false);
    }
  }, [isOpen]);
  useEffect(() => {
    if (meshRef.current) {
      objectInitialPosition.current.copy(meshRef.current.position);
      targetMeshPosition.current.copy(meshRef.current.position);
    }
  }, []);

  useEffect(() => {
    onRotatingChange(isRotating);
  }, [isRotating, onRotatingChange]);
  useEffect(() => {
    onDraggingChange(isDragging);
  }, [isDragging, onDraggingChange]);

  useEffect(() => {
    // console.log("selected: ",selectedId);
    // console.log("isSelected: ",isSelected);
    // console.log("isMarkerActive: ",markerActive);
    // console.log("L/R: ",leftPage,rightPage);
    // console.log("textActive: ",textActive);
    // console.log("posiiton",position);
  }, [id, selectedId, isSelected, leftPage, rightPage, textActive, position]);
  useEffect(() => {
    const handleMouseDown = (event) => {
      if ((!isDragging && !isRotating) || !meshRef.current) return;
      if (isDragging && meshRef.current) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;


        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const point = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, point);

        lastMousePosition.current.copy(point);
        initialGrabPosition.current.copy(point);
        objectInitialPosition.current.copy(meshRef.current.position);

      }
    };
    const handleMouseMove = (event) => {
      if ((!isDragging && !isRotating) || !meshRef.current) return;

      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const point = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, point);

      if (isDragging) {
        const deltaX = point.x - lastMousePosition.current.x;
        const deltaZ = point.z - lastMousePosition.current.z;

        targetMeshPosition.current.x += deltaX;
        targetMeshPosition.current.z += deltaZ;

        lastMousePosition.current.copy(point);
      }
      if (isRotating) {
        const deltaX = mouse.x - lastMousePosition.current.x;
        const rotationSpeed = 2;

        targetRotationY.current -= deltaX * rotationSpeed;

        lastMousePosition.current.x = mouse.x;
        lastMousePosition.current.y = mouse.y;
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isRotating && onPositionUpdate) {
        onRotationUpdate(id, { x: 0, y: targetRotationY.current, z: 0 });
        onPositionUpdate(id, targetMeshPosition.current);
      }

      setIsDragging(false);
      setIsRotating(false);
      if (controls) controls.enabled = true;
    };

    if (isRotating) {
      window.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      if (controls) controls.enabled = false;
    }
    if (isDragging) {
      window.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      if (controls) controls.enabled = false;
    }

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isRotating, camera, gl, controls, plane, id, onPositionUpdate]);

  const handleMeshClick = (e) => {
    e.stopPropagation();


    if (anyMarkerActive || isAnimating.current) {
      return;
    }
    if (isSelected) {
      setSelectedId({ type: null, id: null });
    } else {
      setSelectedId({ type: "book", id: id });
    }
  }
  useEffect(() => {
    if (meshRef.current) {
      targetRotationY.current = meshRef.current.rotation.y;
    }
  }, []);

  const handlePlaneClick = (event, planeSide) => {
    setActivePlane(planeSide);
    if (isOpen && markerActive && textActive) {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(planeSide === "left" ? planeLeftRef.current : planeRightRef.current);

      if (intersects.length > 0) {
        const { point, uv } = intersects[0];

        const planeWidth = 4.3;
        const planeHeight = 6.6;

        const localX = (uv.x - 0.5) * planeWidth;
        const localY = (uv.y - 0.5) * planeHeight;

        setPlaneClickPosition({ x: localX, y: localY });
        setShowTextInput(true);

        console.log('Plane click position', { x: localX, y: localY });
      }
    }
  };
  const handleNextPage = () => {
    if (rightPage >= 30) return;
    setLeftPage(leftPage + 2);
    setRightPage(rightPage + 2);
  };
  const handlePrevPage = () => {
    if (leftPage > 1) {
      setLeftPage(leftPage - 2);
      setRightPage(rightPage - 2);
    }
  }

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textActive && tempContextText) {
      const textTexture = createTextTexture(tempContextText, fontSize, textColor, textAlign, textStyle, fontFamily);
      const newContext = {
        id: nextContextId,
        context: tempContextText,
        position: [planeClickPosition.x, planeClickPosition.y, 0],
        rotation: [0, 0, 0],
        pageNumber: activePlane === "left" ? leftPage : rightPage,
        fontSize: fontSize,
        textColor: textColor,
        textAlign: textAlign,
        textStyle: textStyle,
        fontFamily: fontFamily,
        textTexture: textTexture,
      };

      setPageContexts(id, newContext);
      setNextContextId(prevId => prevId + 1);

      setTempContextText("");
      setShowTextInput(false);
      setTextActive(false);
    }
  };
  const TextPreview = ({ planeSide, text, fontSize, textColor, textAlign }) => {
    const [texture, setTexture] = useState(null);
    const [planePosition, setPlanePosition] = useState(new THREE.Vector3(0, 0, 0));
    const materialRef = useRef();
    const [currentDecalPos, setCurrentDecalPos] = useState(new THREE.Vector3(0, 0, 0));
    const [targetDecalPos, setTargetDecalPos] = useState(new THREE.Vector3(0, 0, 0));
    useEffect(() => {
      if (planeSide === "left" && planeLeftRef.current) {
        setPlanePosition(planeLeftRef.current.position);
      } else if (planeSide === "right" && planeRightRef.current) {
        setPlanePosition(planeRightRef.current.position);
      }
    }, [planeSide]);
    useEffect(() => {
      setTargetDecalPos(new THREE.Vector3(planeClickPosition.x, planeClickPosition.y, 0));
    }, [planeClickPosition]);
    useFrame((state) => {
      if (showTextInput && materialRef.current) {
        const time = state.clock.getElapsedTime();
        materialRef.current.opacity = Math.sin(state.clock.getElapsedTime() * 2.5) * 0.2 + 0.8;
      }
      if (showTextInput) {
        setCurrentDecalPos(prevPos => prevPos.clone().lerp(targetDecalPos, 0.1));
      }
    })
    useEffect(() => {
      if (text) {
        const newTexture = createTextTexture(text, fontSize, textColor, textAlign, textStyle, fontFamily);
        setTexture(newTexture);

        return () => {
          if (newTexture) {
            newTexture.dispose();
          }
        }
      }
    }, [text, fontSize, textColor, textAlign]);

    return (
      <>
        {texture && (
          <Plane args={[4.3, 6.6]} rotation={[-Math.PI / 2, 0, 0]} position={planePosition}>
            <meshStandardMaterial opacity={0} transparent />
            <Decal
              position={currentDecalPos}
              scale={[10, 10]}
              rotation={[0, 0, 0]}>
              <meshStandardMaterial ref={materialRef} map={texture} opacity={0.9} transparent />
            </Decal>
          </Plane>
        )}
      </>
    )
  };

  return (
    <>
      <OrbitControls ref={controlsRef} enabled={false} />
      <group ref={meshRef} position={position} rotation={rotation}>
        <Plane ref={planeLeftRef} args={[4.3, 6.6]} position={[-2.6, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={pageVisible} onClick={(e) => { setPlaneSide("left"); handlePlaneClick(e, "left"); }}>
          <meshStandardMaterial opacity={0} transparent />
          {pageContexts.filter(ctx => ctx.pageNumber === leftPage).map(contextItem => {
            return (
              <Decal
                key={contextItem.id}
                scale={[10, 10]}
                position={contextItem.position}
                rotation={contextItem.rotation}>
                <meshStandardMaterial map={contextItem.textTexture} transparent />
              </Decal>
            )
          })}
          <Text fontSize={0.2} color="black" anchorX="center" anchorY="middle" position={[0, -3.2, 0.01]}>
            {leftPage}
          </Text>
        </Plane>
        <Plane ref={planeRightRef} args={[4.3, 6.6]} position={[2.6, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={pageVisible} onClick={(e) => { setPlaneSide("right"); handlePlaneClick(e, "right"); }}>
          <meshStandardMaterial opacity={0} transparent />
          {pageContexts.filter(ctx => ctx.pageNumber === rightPage).map(contextItem => (
            <Decal
              key={contextItem.id}
              scale={[10, 10]}
              position={contextItem.position}
              rotation={contextItem.rotation}>
              <meshStandardMaterial map={contextItem.textTexture} transparent />
            </Decal>
          ))}
          <Text fontSize={0.2} color="black" anchorX="center" anchorY="middle" position={[0, -3.2, 0.01]}>
            {rightPage}
          </Text>
        </Plane>
        {textActive && showTextInput && markerActive && (
          <>
            <TextPreview
              planeSide={planeSide}
              text={tempContextText}
              fontSize={fontSize}
              textColor={textColor}
              textAlign={textAlign}
              visible={showTextInput && markerActive}
            />
            <Html position={[planeClickPosition.x, 0, -planeClickPosition.y]}>
              <div style={{ background: "white", padding: "10px", borderRadius: "5px" }} >
                <form onSubmit={handleTextSubmit}>
                  <textarea
                    type="text"
                    value={tempContextText}
                    onChange={(e) => {
                      setTempContextText(e.target.value);
                    }}
                    placeholder="Enter Text..."
                    style={{ width: "200px", padding: "5px", height: "100px", textAlign: textAlign }}
                    maxLength={100}

                    autoFocus />
                  <input type="number" value={fontSize} onChange={(e) => {
                    setFontSize(e.target.value);
                  }}
                    placeholder="Enter Font Size..."
                    defaultValue={20}
                    min={20}
                    max={150}

                  />
                  <button type="submit">Add</button>
                  <button type="button" onClick={() => setShowTextInput(false)}>Cancel</button>
                </form>
              </div>
            </Html>
          </>
        )}
        <mesh
          onClick={handleMeshClick}>
          <NoteBook url="/3Dnotes/NoteBookSSS.glb" isOpen={isOpen} skipInitialAnimation={skipInitialAnimation}/>
          {isSelected && !anyMarkerActive && !onShowSettings && (
            <>
              <Html position={[6, 0, 0]} transform rotation-x={-Math.PI / 2} scale={0.9}>
                <div className="objectMenu">
                  <button className="objectButton"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsDragging(true);
                      const mouse = new THREE.Vector2();
                      mouse.x = (e.clientX / gl.domElement.clientWidth) * 2 - 1;
                      mouse.y = -(e.clientY / gl.domElement.clientHeight) * 2 + 1;

                      const raycaster = new THREE.Raycaster();
                      raycaster.setFromCamera(mouse, camera);
                      const point = new THREE.Vector3();
                      raycaster.ray.intersectPlane(plane, point);

                      lastMousePosition.current.copy(point);
                      if (meshRef.current) {
                        objectInitialPosition.current.copy(meshRef.current.position);
                      }
                    }}
                    onMouseUp={() => setIsDragging(false)}
                  >
                    <Hand />
                  </button>
                  <button className="objectButton"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsRotating(true);
                      const mouse = new THREE.Vector2();
                      mouse.x = (e.clientX / gl.domElement.clientWidth) * 2 - 1;
                      mouse.y = -(e.clientY / gl.domElement.clientHeight) * 2 + 1;

                      lastMousePosition.current.x = mouse.x;
                      lastMousePosition.current.y = mouse.y;
                    }}
                    onMouseUp={() => setIsRotating(false)}
                  >
                    <RotateCw />
                  </button>
                  <button className="objectButton" disabled={!isOpen} onClick={(e) => {
                    e.stopPropagation();
                    focusOnCube();
                  }}
                  >
                    <PencilLine />
                  </button>
                  <button className="objectButton" disabled={!isOpen} onClick={(e) => {
                    e.stopPropagation();
                    handleNextPage();
                  }}>
                    <ArrowRight />
                  </button>
                  <button className="objectButton" disabled={!isOpen} onClick={(e) => {
                    e.stopPropagation();
                    handlePrevPage();
                  }}>
                    <ArrowLeft />
                  </button>
                  <button className="objectButton" onClick={() => {
                    toggleOpen();
                  }}>
                    <BookOpen />
                  </button>
                </div>
              </Html>
            </>
          )}

          {markerActive && (
            <>
              <Html position={[6, 0, -4.5]} rotation-x={Math.PI / 2} rotation-y={.2} transform scale={0.6}>
                <button className="objectButton"
                  onClick={(e) => {
                    e.stopPropagation();
                    exitMarker();
                  }}>
                  <X />
                </button>
              </Html>
              <Html position={[0, 0, 5.2]} rotation-x={Math.PI / 2 - 0.3} transform scale={0.6}>
                <div className="markerMenu">
                  <button className="objectButton" onClick={(e) => {
                    e.stopPropagation();
                    handlePrevPage();
                  }}>
                    <ArrowLeft />
                  </button>
                  <button className="objectButton" onClick={(e) => {
                    e.stopPropagation();
                    handleNextPage();
                  }}>
                    <ArrowRight />
                  </button>
                </div>
              </Html>
              <Html position={[6.5, 0, 0]} rotation-x={-Math.PI / 2} rotation-y={-0.2} transform scale={0.6}>
                <div className="markerMenuColumn">
                  <select className="fontSelect" style={{ fontFamily: fontFamily }} value={fontFamily} onChange={(e) => {
                    setFontFamily(e.target.value);
                  }}>
                    {fontFamilies.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
              </Html>
              <Html position={[-6, 0, 0]} rotation-x={-Math.PI / 2} rotation-y={0.2} transform scale={0.6}>
                <div className="markerMenuColumn">
                  <button className={`objectButton ${textStyle === "bold" ? "active" : ""}`} onClick={(e) => {
                    e.stopPropagation();
                    setTextStyle("bold");
                  }}>
                    <Bold />
                  </button>
                  <button className={`objectButton ${textStyle === "italic" ? "active" : ""}`} onClick={(e) => {
                    e.stopPropagation();
                    setTextStyle("italic");
                  }}>
                    <Italic />
                  </button>
                  <button className={`objectButton ${textStyle === "normal" ? "active" : ""}`} onClick={(e) => {
                    e.stopPropagation();
                    setTextStyle("normal");
                  }}>
                    <RemoveFormatting />
                  </button>
                </div>
              </Html>
              <Html position={[0, 0, -5.5]} rotation-x={-Math.PI / 2 + 0.2} transform scale={0.6}>
                <div className="markerMenu">
                  <button className={`objectButton ${textActive ? "active" : ""}`} onClick={(e) => {
                    e.stopPropagation();
                    setTextActive(!textActive);
                  }}>
                    <TextCursor />
                  </button>
                  <div className="textColorPicker">
                    <input type="color" className="colorPicker" value={textColor} onChange={(e) => {
                      setTextColor(e.target.value);
                    }} />
                  </div>
                </div>
              </Html>
              <Html position={[0, 1, -4]} rotation-x={Math.PI / 2 + 0.2} transform scale={0.4}>
                <div className="markerMenu">
                  <button className={`objectButton ${textAlign === "left" ? "active" : ""}`} onClick={(e) => {
                    e.stopPropagation();
                    setTextAlign("left");
                  }}>
                    <AlignLeft />
                  </button>
                  <button className={`objectButton ${textAlign === "center" ? "active" : ""}`} onClick={(e) => {
                    e.stopPropagation();
                    setTextAlign("center");
                  }}>
                    <AlignCenter />
                  </button>
                  <button className={`objectButton ${textAlign === "right" ? "active" : ""}`} onClick={(e) => {
                    e.stopPropagation();
                    setTextAlign("right");
                  }}>
                    <AlignRight />
                  </button>
                </div>
              </Html>
            </>
          )}
        </mesh>
      </group>
    </>
  )
}
const App = () => {
  const [isRotating, setIsRotating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [anyMarkerActive, setAnyMarkerActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fogLevel, setFogLevel] = useState(100);
  const [gridValue1, setGridValue1] = useState(2);
  const [gridValue2, setGridValue2] = useState(6);
  const [backgroundColor, setBackgroundColor] = useState("#3057E1");
  const [selected, setSelected] = useState({ type: null, id: null });
  const [books, setBooks] = useState([]);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [nextBookId, setNextBookId] = useState(1);
  const [nextStickyId, setNextStickyId] = useState(1);

  const exportScene = () => {
    const sceneData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      books: books.map(book => {
        return {
          id: book.id,
          position: book.position,
          rotation: book.rotation,
          pageContexts: book.pageContexts.map(context => ({
            id: context.id,
            context: context.context,
            position: context.position,
            rotation: context.rotation,
            pageNumber: context.pageNumber,
            fontSize: context.fontSize,
            textColor: context.textColor,
            textAlign: context.textAlign,
            textStyle: context.textStyle,
            fontFamily: context.fontFamily
          })),
          isOpen: book.isOpen
        }
      }),
      stickyNotes: stickyNotes.map(sticky => ({
        id: sticky.id,
        position: sticky.position,
        rotation: sticky.rotation,
        stickyContents: sticky.stickyContents
      })),
      nextIds: {
        nextBookId,
        nextStickyId
      }
    };

    const dataStr = JSON.stringify(sceneData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `3d-notes-scene-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importScene = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const sceneData = JSON.parse(e.target.result);

        if (!sceneData.version) {
          alert("Invalid Scene File!");
          return;
        }

        if (sceneData.books) {
          const loadedBooks = sceneData.books.map(bookData => ({
            ...bookData,
            skipInitialAnimation: true,
            pageContexts: bookData.pageContexts.map(context => ({
              ...context,
              textTexture: createTextTexture(
                context.context,
                context.fontSize,
                context.textColor,
                context.textAlign,
                context.textStyle,
                context.fontFamily
              )
            }))
          }));
          setBooks(loadedBooks);
        }

        if (sceneData.stickyNotes) {
          const loadedStickys = sceneData.stickyNotes.map(stickyData => ({
            ...stickyData,
            stickyContents: stickyData.stickyContents || []
          }))

          setStickyNotes(loadedStickys);
        }

        if (sceneData.nextIds) {
          setNextBookId(sceneData.nextIds.nextBookId || 1);
          setNextStickyId(sceneData.nextIds.nextStickyId || 1);
        }

        setSelected({ type: null, id: null });

        alert("Scene Succesfully Loaded!");
      } catch (error) {
        console.error("Scene Loading Error:", error);
        alert("An Error Occurred While Loading Scene!");
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const clearScene = () => {
    console.log("aaa")
    if (window.confirm("Are u sure to clean whole scene?")) {
      setBooks([]);
      setStickyNotes([]);
      setNextBookId(1);
      setNextStickyId(1);
      setSelected({ type: null, id: null });
    }
  };

  const createNSticky = () => {
    const randomX = Math.floor(Math.random() * 20) - 10;
    const randomZ = Math.floor(Math.random() * 20) - 10;

    const newSticky = {
      id: nextStickyId,
      position: [randomX, 2.5, randomZ],
      rotation: [0, 0, 0],
      stickyContents: []
    }

    setStickyNotes(prevStickyNotes => [...prevStickyNotes, newSticky]);
    setNextStickyId(prevId => prevId + 1);
  }

  const createNBook = () => {
    const randomX = Math.floor(Math.random() * 20) - 10;
    const randomZ = Math.floor(Math.random() * 20) - 10;

    const newBook = {
      id: nextBookId,
      position: [randomX, 2, randomZ],
      rotation: [0, 0, 0],
      pageContexts: [],
      isOpen: true
    }

    setBooks([...books, newBook]);
    setNextBookId(prevId => prevId + 1);
  }

  const setBookOpen = (bookId, open) => {
    setBooks(prevBooks =>
      prevBooks.map(book =>
        book.id === bookId ? { ...book, isOpen: open } : book
      )
    )
  }

  const addContextToBook = (bookId, newContext) => {
    setBooks(prevBooks =>
      prevBooks.map(book =>
        book.id === bookId ? { ...book, pageContexts: [...book.pageContexts, newContext] } : book
      )
    );
  };

  const addContextToSticky = (stickyId, newContext) => {
    setStickyNotes(prevSticky =>
      prevSticky.map(sticky =>
        sticky.id === stickyId ? { ...sticky, stickyContents: [...(sticky.stickyContents || []), newContext] } : sticky
      )
    );
  };

  const updateBookPosition = (bookId, newPosition) => {
    setBooks(prevBooks =>
      prevBooks.map(book =>
        book.id === bookId ? { ...book, position: [newPosition.x, newPosition.y, newPosition.z] } : book
      )
    )
  }

  const updateBookRotation = (bookId, newRotation) => {
    setBooks(prevBooks =>
      prevBooks.map(book =>
        book.id === bookId ? { ...book, rotation: [0, newRotation.y, 0] } : book
      )
    )
  }

  const updateStickyPosition = (stickyId, newPosition) => {
    setStickyNotes(prevSticky =>
      prevSticky.map(sticky =>
        sticky.id === stickyId ? { ...sticky, position: [newPosition.x, newPosition.y, newPosition.z] } : sticky
      )
    )
  }

  const updateStickyRotation = (stickyId, newRotation) => {
    setStickyNotes(prevSticky =>
      prevSticky.map(sticky =>
        sticky.id === stickyId ? { ...sticky, rotation: [0, newRotation.y, 0] } : sticky
      )
    )
  }

  const handleRotatingChange = (rotating) => {
    setIsRotating(rotating);
    console.log("books", books)
  };
  const handleDraggingChange = (dragging) => {
    setIsDragging(dragging);
  };

  const startPos = new THREE.Vector3(0, 10, 5);
  return (
    <div className="App">
      <Canvas shadows camera={{ position: [startPos.x, startPos.y, startPos.z] }} gl={{ antialias: true }} style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <OrbitControls enabled={!isRotating && !isDragging && !anyMarkerActive && !showSettings} makeDefault />
        <color attach="background" args={[backgroundColor]} />
        <Environment preset="city" />
        <InfiniteGrid size1={gridValue1} size2={gridValue2} color={0xffffff} distance={fogLevel} axes="xzy" />
        {!anyMarkerActive &&
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={["red", "green", "blue"]} labelColor="black" />
          </GizmoHelper>
        }
        {books.map(book => (
          <CubeR
            key={book.id}
            id={book.id}
            position={book.position}
            rotation={book.rotation}
            pageContexts={book.pageContexts}
            isOpen={book.isOpen}
            skipInitialAnimation={book.skipInitialAnimation || false}
            setPageContexts={addContextToBook}
            onDraggingChange={handleDraggingChange}
            onRotatingChange={handleRotatingChange}
            onShowSettings={showSettings}
            selectedId={selected}
            setSelectedId={setSelected}
            anyMarkerActive={anyMarkerActive}
            setAnyMarkerActive={setAnyMarkerActive}
            isSelected={selected && selected.type === "book" && selected.id === book.id}
            onPositionUpdate={updateBookPosition}
            onRotationUpdate={updateBookRotation}
            setBookOpen={setBookOpen}
          />
        ))}

        {stickyNotes.map(sticky => {
          return (
            <StickyNote
              key={sticky.id}
              id={sticky.id}
              position={sticky.position}
              rotation={sticky.rotation}
              onDraggingChange={handleDraggingChange}
              onRotatingChange={handleRotatingChange}
              onShowSettings={showSettings}
              anyMarkerActive={anyMarkerActive}
              setAnyMarkerActive={setAnyMarkerActive}
              selectedId={selected}
              setSelectedId={setSelected}
              isSelected={selected && selected.type === "sticky" && selected.id === sticky.id}
              Model={StickyNoteModel}
              onPositionUpdate={updateStickyPosition}
              onRotationUpdate={updateStickyRotation}
              stickyContents={sticky.stickyContents}
              addContextToSticky={addContextToSticky}
            />
          )
        })}
      </Canvas>
      <UserInterface
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
        fogLevel={fogLevel}
        setFogLevel={setFogLevel}
        gridValue1={gridValue1}
        setGridValue1={setGridValue1}
        gridValue2={gridValue2}
        setGridValue2={setGridValue2}
        createBook={createNBook}
        createSticky={createNSticky}
        anyMarkerActive={anyMarkerActive}
        exportScene={exportScene}
        importScene={importScene}
        clearSScene={clearScene}
      />
    </div>

  )
}
useGLTF.preload("/3Dnotes/NoteBookSSS.glb");
useGLTF.preload("/3Dnotes/StickyNote.glb");
export default App;