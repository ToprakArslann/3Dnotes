import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Edges, GizmoHelper, GizmoViewport, useGLTF, Stage, Environment } from "@react-three/drei";
import { useEffect, useRef, useState, useMemo } from "react";
import { InfiniteGridHelper } from "./InfiniteGridHelper";
import * as THREE from "three";
import UserInterface from "./UserInterface";
import "./App.css";
import { ArrowLeft, ArrowRight, Hand, PencilLine, RotateCw, X } from "lucide-react";

const InfiniteGrid = ({ size1 = 10, size2 = 100, color = 0x444444, distance = 8000, axes = 'xzy' }) => {
  const gridColor = color instanceof THREE.Color ? color : new THREE.Color(color);
  
  return (
    <primitive 
      object={new InfiniteGridHelper(size1, size2, gridColor, distance, axes)}
    />
  );
};

const NoteBook = ({ url}) => {
  const { scene } = useGLTF(url);
  const group = useRef();
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  return (
    <group
      ref={group}
      position={[0,0,0]}
      scale={2}
      rotation={[0,0,0]}
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
  const {camera, gl, controls} = useThree();
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
  return(
    <>
      <OrbitControls ref={controlsRef} enabled={false}/>
      <mesh ref={meshRef} position={position} 
      onClick={handleMeshClick}>
        <NoteBook url="NoteBookSSS.glb"/>
        <arrowHelper
          ref={arrowRef}
          position={[0, 0.25, 2.5]}
          color={0xff0000}
          visible={true}
        />
        {isSelected && !anyMarkerActive && !onShowSettings && (
          <>
            <Html position={[3,0.3,0]}>
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