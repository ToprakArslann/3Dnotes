import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, GizmoHelper, GizmoViewport, useGLTF, Environment, useAnimations, Decal,Plane} from "@react-three/drei";
import { useEffect, useRef, useState, useMemo } from "react";
import { InfiniteGridHelper } from "./InfiniteGridHelper";
import * as THREE from "three";
import UserInterface from "./UserInterface";
import "./App.css";
import { ArrowLeft, ArrowRight, BookOpen, Hand, PencilLine, RotateCw, X } from "lucide-react";

const InfiniteGrid = ({ size1 = 10, size2 = 100, color = 0x444444, distance = 8000, axes = 'xzy' }) => {
  const gridColor = color instanceof THREE.Color ? color : new THREE.Color(color);
  
  return (
    <primitive 
      object={new InfiniteGridHelper(size1, size2, gridColor, distance, axes)}
    />
  );
};

const NoteBook = ({ url, isOpen }) => {
  const { scene, animations } = useGLTF(url);
  const group = useRef();
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const [currentAction, setCurrentAction] = useState(null);
  const prevIsOpen = useRef(isOpen);

  useEffect(() => {
    const action = actions["OpenAction"];
    if (action && !currentAction) {
      action.reset().setLoop(THREE.LoopOnce, 1).play();
      action.clampWhenFinished = true;
      setCurrentAction(action);      
    }
  }, [actions]);

  useEffect(() => {
    if (!actions || prevIsOpen.current === isOpen) return;

    const newActionName = isOpen ? "OpenAction" : "CloseAction";
    const newAction = actions[newActionName];
    
    if (currentAction) currentAction.stop();
    newAction.reset().setLoop(THREE.LoopOnce, 1).play();
    newAction.clampWhenFinished = true;
    setCurrentAction(newAction);
    prevIsOpen.current = isOpen;
  }, [isOpen, actions]);

  return (
    <group
      ref={group}
      position={[0,0,0]}
      scale={2}
      rotation={[0,Math.PI,0]}
    >
      <primitive object={clonedScene}/>
    </group>
  )
};
const CubeR = ({id,position,onDraggingChange, onRotatingChange, onShowSettings, selectedId, setSelectedId, anyMarkerActive,setAnyMarkerActive,isSelected}) => {
  const meshRef = useRef();
  const arrowRef = useRef();
  const controlsRef = useRef();
  const isAnimating = useRef(false);
  const animationProgress = useRef(0);
  const [markerActive, setMarkerActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const {camera, gl, controls, raycaster, mouse} = useThree();
  const plane = new THREE.Plane(new THREE.Vector3(0,1,0), 2);
  const startPosition = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const targetMeshPosition = useRef(new THREE.Vector3(...position));
  const targetRotationY = useRef(0);
  const lastMousePosition = useRef(new THREE.Vector3());
  const initialGrabPosition = useRef(new THREE.Vector3());
  const objectInitialPosition = useRef(new THREE.Vector3());
  const [isOpen, setIsOpen] = useState(true);
  const [animationCooldown, setAnimationCooldown] = useState(false);
  const [planeClickPosition, setPlaneClickPosition] = useState({x:0, y:0});
  const planeRef = useRef();

  const toggleOpen = () => {
    if (animationCooldown) return; 
    setIsOpen(!isOpen);
    setAnimationCooldown(true); 
    setTimeout(() => {
      setAnimationCooldown(false); 
    }, 1100);
  };
  const focusOnCube = () => {
    if(isAnimating.current) return;
    setSelectedId(null);
    const boxDirection = new THREE.Vector3(0,1,0.1);
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
    setAnyMarkerActive(true);
  };

  const exitMarker = () => {
    if(isAnimating.current) return;
    setMarkerActive(false);
    setAnyMarkerActive(false);
    setSelectedId(null);
    controls.enabled = true;
    camera.position.copy(startPosition.current);
  }
  useFrame((state, delta) => {
    if(isAnimating.current && markerActive){
      animationProgress.current += delta * 0.5;

      const progress = Math.min(animationProgress.current, 1);

      const easedProgress = easeInOutCubic(progress);

      camera.position.lerpVectors(startPosition.current, targetPosition.current, easedProgress);
      controlsRef.current.target.lerpVectors(startLookAt.current, currentLookAt.current, easedProgress);

      controlsRef.current.update();

      if(progress >= 1){
        isAnimating.current = false;
        controls.enabled = false;
      }
    }
    if(meshRef.current && isDragging){
      const smoothness = 0.15;
      meshRef.current.position.lerp(targetMeshPosition.current,smoothness);
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
    if(meshRef.current){
      objectInitialPosition.current.copy(meshRef.current.position);
      targetMeshPosition.current.copy(meshRef.current.position);
    }
  }, []); 

  useEffect(() => {
    onRotatingChange(isRotating);
  },[isRotating, onRotatingChange]);
  useEffect(() => {
    onDraggingChange(isDragging);
  },[isDragging, onDraggingChange]);

  useEffect(() => {
    console.log("id aa",id);
    console.log("id ss",selectedId);
    console.log("id vv",isSelected);
    console.log("aaaaaaa",markerActive);

  }, [id, selectedId, isSelected]);
  useEffect(() => {
    const handleMouseDown = (event) => {
      if((!isDragging && !isRotating)|| !meshRef.current) return;
      if(isDragging && meshRef.current){
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;
      
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse,camera);
        const point = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane,point);
 
        lastMousePosition.current.copy(point);
        initialGrabPosition.current.copy(point);
        objectInitialPosition.current.copy(meshRef.current.position);

      }
    };
    const handleMouseMove = (event) => {
      if((!isDragging && !isRotating)|| !meshRef.current) return;

      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;
    
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse,camera);
      const point = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane,point);

      if(isDragging){
        const deltaX = point.x - lastMousePosition.current.x;
        const deltaZ = point.z - lastMousePosition.current.z;

        targetMeshPosition.current.x += deltaX;
        targetMeshPosition.current.z += deltaZ;

        lastMousePosition.current.copy(point);
      }
      if(isRotating){
        const deltaX = mouse.x - lastMousePosition.current.x;
        const rotationSpeed = 2;
        
        targetRotationY.current -= deltaX * rotationSpeed;
        
        lastMousePosition.current.x = mouse.x;
        lastMousePosition.current.y = mouse.y;
      }
    };

    const handleMouseUp = () =>{ 
      setIsDragging(false);      setIsRotating(false);
      if(controls) controls.enabled = true;
    };

    if(isRotating){
      window.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      if(controls) controls.enabled = false;
    }
    if(isDragging){
      window.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      if(controls) controls.enabled = false;
    }

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isRotating, camera,gl, controls, plane]);

  const handleMeshClick = (e) => {
    e.stopPropagation();
    

    if( anyMarkerActive || isAnimating.current) {
      return;
    }
    if(isSelected){
      setSelectedId(null);
    } else {
      setSelectedId(id);
    }
  }
  useEffect(() => {
    if (meshRef.current) {
      targetRotationY.current = meshRef.current.rotation.y;
    }
  }, []);
  const handlePlaneClick = (event) => {
    event.stopPropagation();
    if(isOpen && markerActive){
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(planeRef.current);

      if (intersects.length > 0){
        const { point, uv } = intersects[0];
        
        const planeWidth = 4.3;
        const planeHeight = 6.6;
        
        const localX = (uv.x - 0.5) * planeWidth;
        const localY = (uv.y - 0.5) * planeHeight;
        
        setPlaneClickPosition({ x: localX, y: localY });
        
        console.log('Plane click position', { x: localX, y: localY });
      }
    }
  };
  const createTextTexture = (text , fontSize = 100) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.font = `${fontSize}px Arial`
    const metrics = ctx.measureText(text)
    canvas.width = metrics.width * 1.2 
    canvas.height = fontSize * 1.5
    
    ctx.fillStyle = "rgba(0,0,0,0)" 
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.font = `${fontSize}px Arial`
    ctx.fillStyle = "black"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    
    ctx.globalCompositeOperation = 'source-over'
    ctx.translate(0.5, 0.5) 
    ctx.fillText(text, canvas.width/2, canvas.height/2)
    
    return new THREE.CanvasTexture(canvas)
  }

  const textTexture = createTextTexture( "Lorem ipsum dolor sit amet.", 100 );

  const textureAspect = textTexture.image.width / textTexture.image.height;
  const decalWidth = 5;
  const decalHeight = decalWidth / textureAspect;

  return(
    <>
      <OrbitControls ref={controlsRef} enabled={false}/>
      <group ref={meshRef} position={position} >
        <Plane ref={planeRef} args={[4.3,6.6]} position={[-2.6, 0.2, 0]} rotation={[-Math.PI/2, 0, 0]} visible={isOpen} onClick={handlePlaneClick}>
          <meshStandardMaterial opacity={0} transparent/>
          <Decal scale={[decalWidth,decalHeight]} position={[planeClickPosition.x,planeClickPosition.y,0]} rotation={[0,0,0.50]} makeDefault >
            <meshStandardMaterial map={textTexture} transparent/>
          </Decal>
        </Plane> 
        <mesh 
        onClick={handleMeshClick}>
          <NoteBook url="NoteBookSSS.glb" isOpen={isOpen}/>
          <arrowHelper
            ref={arrowRef}
            position={[0, 0.25, 2.5]}
            color={0xff0000}
            visible={true}
          />
          {isSelected && !anyMarkerActive && !onShowSettings && (
            <>
              <Html position={[5,0.5,-5]}>
                <div className="objectMenu">
                  <button className="objectButton"
                  onMouseDown={(e) =>{
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
                    <Hand/>
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
                    <RotateCw/>
                  </button>
                  <button className="objectButton"
                    onClick={(e) => {
                      e.stopPropagation();
                      focusOnCube();
                    }}
                  >
                    <PencilLine/>
                  </button>
                  <button className="objectButton">
                    <ArrowRight/>
                  </button>
                  <button className="objectButton">
                    <ArrowLeft/>
                  </button>
                  <button className="objectButton" onClick={() => {
                    toggleOpen();
                  }}>
                    <BookOpen/>
                  </button>
                </div>
              </Html>
            </>
          )}
          
          {markerActive && (
            <>
              <Html position={[4, 0.3, -4]}>
                <button className="objectButton"
                  onClick={(e) => {
                    e.stopPropagation();
                    exitMarker();
                  }}>
                    <X/>
                </button>
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
  const [ showSettings, setShowSettings ] = useState(false);
  const [ fogLevel, setFogLevel ] = useState(100);
  const [ gridValue1, setGridValue1 ] = useState(2);
  const [ gridValue2, setGridValue2 ] = useState(6);
  const [ backgroundColor, setBackgroundColor ] = useState("#3057E1");
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [nextBookId, setNextBookId] = useState(1); 
  
  const createNBook = () => {
    const randomX = Math.floor(Math.random() * 20) - 10;
    const randomZ = Math.floor(Math.random() * 20) - 10;
    
    const newBook = {
      id: nextBookId,
      position: [randomX,2,randomZ]
    }
    
    setBooks([...books, newBook]);
    setNextBookId(nextBookId + 1);
  }
  const handleRotatingChange = (rotating) => {

    setIsRotating(rotating);
  };
  const handleDraggingChange = (dragging) => {
    setIsDragging(dragging);
  };
  
  const startPos = new THREE.Vector3(0,10,5);
  return (
    <div className="App">
      <Canvas shadows camera={{position: [startPos.x,startPos.y,startPos.z]}} gl={{antialias: true}} style={{height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <OrbitControls enabled={!isRotating && !isDragging && !anyMarkerActive && !showSettings} makeDefault/>
        <color attach="background" args={[backgroundColor]}/>
        <Environment preset="city"/>
        <InfiniteGrid size1={gridValue1} size2={gridValue2} color={0xffffff} distance={fogLevel} axes="xzy"/>
        {!anyMarkerActive &&
          <GizmoHelper alignment="bottom-right" margin={[80,80]} >
            <GizmoViewport axisColors={["red", "green", "blue"]} labelColor="black" />
          </GizmoHelper>
        }
        {books.map(book => (
          <CubeR 
            key={book.id}
            id={book.id}
            position={book.position}
            onDraggingChange={handleDraggingChange}
            onRotatingChange={handleRotatingChange} 
            onShowSettings={showSettings}
            selectedId={selectedBookId}
            setSelectedId={setSelectedBookId}
            anyMarkerActive={anyMarkerActive}
            setAnyMarkerActive={setAnyMarkerActive}
            isSelected={selectedBookId === book.id}
          />
        ))}
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
        anyMarkerActive={anyMarkerActive}
      />
    </div>

  )
}
useGLTF.preload("NoteBookSSS.glb");
export default App;