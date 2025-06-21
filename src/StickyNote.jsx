import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { X, Hand, RotateCw, PencilLine } from 'lucide-react';
import "./App.css";

const StickyNote = ({
  id,
  position,
  rotation,
  onDraggingChange,
  onRotatingChange,
  onShowSettings,
  selectedId,
  setSelectedId,
  anyMarkerActive,
  setAnyMarkerActive,
  isSelected,
  Model,
  onPositionUpdate,
  onRotationUpdate,
  stickyContents = [],
  addContextToSticky
}) => {
  const meshRef = useRef();
  const controlsRef = useRef();
  const animationProgress = useRef(0);
  const isAnimating = useRef(false);
  const [markerActive, setMarkerActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const startPosition = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const lastMousePosition = useRef(new THREE.Vector3());
  const initialGrabPosition = useRef(new THREE.Vector3());
  const objectInitialPosition = useRef(new THREE.Vector3());
  const targetMeshPosition = useRef(new THREE.Vector3(...position));
  const targetRotationY = useRef(0);
  const [text, setText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const textRef = useRef();
  const planeRef = useRef();
  const { camera, controls, gl } = useThree();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 2);

  const maxLineLength = 20;
  const maxLines = 8;
  
  function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
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

  useEffect(() => {
    if (markerActive) {
      setAnyMarkerActive(true);
    }
  }, [markerActive, setAnyMarkerActive]);

  useEffect(() => {
    if (!markerActive) return;
    
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530);
    
    return () => clearInterval(cursorInterval);
  }, [markerActive]);

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
      if(isDragging || isRotating && onPositionUpdate) {
        onRotationUpdate(id,{x:0,y:targetRotationY.current,z:0});
        onPositionUpdate(id,targetMeshPosition.current);
      }

      setIsDragging(false);
      setIsRotating(false);
      if (controls) controls.enabled = true;
    };

    if (isRotating || isDragging) {
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
  }, [isDragging, isRotating, camera, gl, controls, plane]);

  const getDisplayText = () => {
    if (!markerActive) return text;
    
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1];
    
    if (cursorVisible) {
      lines[lines.length - 1] = lastLine + '|';
    }
    
    return lines.join('\n');
  };

  const handlePlaneClick = (e) => {
    e.stopPropagation();

    if (anyMarkerActive || isAnimating.current) {
      return;
    }

    if (isSelected) {
      setSelectedId({type: null, id: null});
    } else {
      setSelectedId({type: "sticky", id: id});
    }
  };
  
  useEffect(() => {
    if (!markerActive) return;
    const currentLines = text.split('\n');
    const currentLineCount = currentLines.length;
    
    const handleKeyDown = (e) => {
      e.preventDefault();
      
      setCursorVisible(true);
      
      if (e.key === 'Escape') {
        setMarkerActive(false);
        setAnyMarkerActive(false);
        return;
      }
      
      if (e.key === 'Backspace') {
        setText(prev => prev.slice(0, -1));
        return;
      }

      if (e.key === 'Enter') {
        if (currentLineCount >= maxLines) return;

        setText(prev => prev + '\n');
        return;
      }
      
      if (e.key.length === 1) {
        const currentLineIdx = currentLines.length - 1;
        const currentLine = currentLines[currentLineIdx];
        
        if (currentLine.length >= maxLineLength && currentLineCount >= maxLines) return;

        if (currentLine.length >= maxLineLength) {
          setText(prev => prev + '\n' + e.key);
        } else {
          setText(prev => prev + e.key);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markerActive, text, setAnyMarkerActive]);

  const focusOnCube = () => {
    if (isAnimating.current || !meshRef.current) return;
    setSelectedId(null);
  
    const meshPosition = meshRef.current.position.clone();
  
    const directionVector = new THREE.Vector3(0, -0.6, -0.4);
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, meshRef.current.rotation.y, 0)
    );
    directionVector.applyQuaternion(quaternion);
  
    const cameraDistance = 8;
    const cameraHeight = 4;
  
    const targetPos = meshPosition.clone().add(directionVector.clone().multiplyScalar(-cameraDistance)).add(new THREE.Vector3(0, cameraHeight, 0));
  
    if (camera && controlsRef.current) {
      startPosition.current.copy(camera.position);
      startLookAt.current.copy(controlsRef.current.target);
      targetPosition.current.copy(targetPos);
      currentLookAt.current.copy(meshPosition);
  
      animationProgress.current = 0;
      isAnimating.current = true;
  
      controls.enabled = false;
      setMarkerActive(true);
    }
  };
  
  const exitMarker = () => {
    if (isAnimating.current) return;
    const newContext ={
      id: Date.now(),
      text: text
    }
    addContextToSticky(id, newContext);
    setMarkerActive(false);
    setAnyMarkerActive(false);
    setSelectedId(null);
    controls.enabled = true;
    camera.position.copy(startPosition.current);
  };

  useEffect(() => {
    if (meshRef.current) {
      targetRotationY.current = meshRef.current.rotation.y;
    }
  }, []);

  return (
    <>
      <OrbitControls ref={controlsRef} enabled={false} />
      <group ref={meshRef} position={position} rotation={rotation}>
        <mesh
          ref={planeRef}
          onClick={handlePlaneClick}
          rotation={[-Math.PI/2, Math.PI*2, 0]}
        >
          <Model url="/3Dnotes/StickyNote.glb"/>
          <Text
            ref={textRef}
            position={[0, 0, 0.01]}
            rotation={[0, 0, 0]}
            fontSize={0.3}
            maxWidth={6}
            lineHeight={1.2}
            color="#000000"
            anchorX="center"
            anchorY="middle"
            textAlign="center"
          >
            {getDisplayText()}
          </Text>
          {stickyContents && stickyContents.map(ctx => (
            <Text
            key={ctx.id}
            position={[0, 0, 0.01]}
            rotation={[0, 0, 0]}
            fontSize={0.3}
            maxWidth={6}
            lineHeight={1.2}
            color="#000000"
            anchorX="center"
            anchorY="middle"
            textAlign="center"
            >
              {ctx.text}
            </Text>
          ))}
        </mesh>

        {markerActive && (
          <Html position={[4, 0, -3.5]} rotation-x={Math.PI/2} rotation-y={.2} transform scale={0.6}>
            <button className="objectButton"
              onClick={(e) => {
                e.stopPropagation();
                exitMarker();
              }}>
              <X/>
            </button>
          </Html>
        )}
        
        {isSelected && !anyMarkerActive && !onShowSettings && (
          <Html position={[4, 0, 0]} transform rotation-x={-Math.PI/2} scale={0.9}>
            <div className="objectMenu">
              <button 
                className="objectButton"
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
                <Hand/>
              </button>
              <button 
                className="objectButton"
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
              <button 
                className="objectButton" 
                onClick={(e) => {
                  e.stopPropagation();
                  focusOnCube();
                }}
              >
                <PencilLine/>
              </button>
            </div>
          </Html>
        )}
      </group>
    </>
  );
};

export default StickyNote;