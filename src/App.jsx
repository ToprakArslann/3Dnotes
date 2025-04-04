import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Edges, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { InfiniteGridHelper } from "./InfiniteGridHelper";
import * as THREE from "three";
import UserInterface from "./UserInterface";
import "./App.css";
import { Hand, PencilLine, RotateCw } from "lucide-react";
const InfiniteGrid = ({ size1 = 10, size2 = 100, color = 0x444444, distance = 8000, axes = 'xzy' }) => {
  const gridColor = color instanceof THREE.Color ? color : new THREE.Color(color);
  
  return (
    <primitive 
      object={new InfiniteGridHelper(size1, size2, gridColor, distance, axes)}
    />
  );
};
const CubeR = ({onDraggingChange, onRotatingChange, onMarkerActive, onShowSettings}) => {
  const meshRef = useRef();
  const arrowRef = useRef();
  const controlsRef = useRef();
  const isAnimating = useRef(false);
  const animationProgress = useRef(0);
  const [selected, setSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [markerActive, setMarkerActive] = useState(false);
  const {camera, gl, controls} = useThree();
  const plane = new THREE.Plane(new THREE.Vector3(0,1,0), 2);
  const startPosition = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const [ showSettings, setShowSettings ] = useState(false);
  const focusOnCube = () => {
    if(isAnimating.current) return;

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
  };

  const exitMarker = () => {
    if(isAnimating.current) return;
    setMarkerActive(false);
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
  });

  function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  useEffect(() => {
    onMarkerActive(markerActive);
  },[markerActive, onMarkerActive]);
  useEffect(() => {
    onRotatingChange(isRotating);
  },[isRotating, onRotatingChange]);
  useEffect(() => {
    onDraggingChange(isDragging);
  },[isDragging, onDraggingChange]);
  
  useEffect(() => {
    let previousMouseX = 0;
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
        meshRef.current.position.set(point.x, 2, point.z);
      }
      if(isRotating){
        const deltaX = mouse.x - previousMouseX;
        const rotationSpeed = 2;
        meshRef.current.rotation.y -= deltaX * rotationSpeed;
      }
      previousMouseX = mouse.x;
    
    };

    const handleMouseUp = () =>{ 
      setIsDragging(false);
      setIsRotating(false);
      if(controls) controls.enabled = true;
    };

    if(isRotating){
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      if(controls) controls.enabled = false;
    }
    if(isDragging){
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      if(controls) controls.enabled = false;
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isRotating, camera,gl, controls, plane]);
  return(
    <>
      <OrbitControls ref={controlsRef} enabled={false}/>
      <mesh ref={meshRef} position={[0,2,0]} onClick={(e) => {
        if(markerActive) {
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        setSelected(!selected);
      }}>
        <boxGeometry args={[6,0.5,5]}/>
        <pointLight position={[0,2,0]} intensity={10} color={0xffffff}/>
        <meshLambertMaterial color="595959" emissive={"#595959"}/>
        <arrowHelper
          ref={arrowRef}
          position={[0, 0.25, 2.5]}
          color={0xff0000}
          visible={true}
        />
        {selected && !markerActive && !onShowSettings && (
          <>
            <Edges>
              <lineSegments>
                <edgesGeometry attach="geometry" args={[meshRef.current.geometry]} />
                <lineBasicMaterial color={"0xff0000"}/>
              </lineSegments>
            </Edges>
            <Html position={[3,0.3,0]}>
              <div className="objectMenu">
                <button className="objectButton"
                onMouseDown={(e) =>{
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onMouseUp={() => setIsDragging(false)}
                >
                  <Hand/>
                </button>
                <button className="objectButton"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsRotating(true);
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
              </div>
            </Html>
          </>
        )}
        
        {markerActive && (
          <>
            <Html position={[4, 0.3, -4]}>
              <button style={{ 
                background: "white",
                margin: "auto",
                cursor: "grab",}}
                onClick={(e) => {
                  e.stopPropagation();
                  exitMarker();
                }}>
                  <img src="src/assets/xmark-solid.svg" style={{width: "20px"}} draggable="false"/>

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
  const [markerActive, setMarkerActive] = useState(false);
  const [ showSettings, setShowSettings ] = useState(false);
  const [ fogLevel, setFogLevel ] = useState(200);
  const [ gridValue1, setGridValue1 ] = useState(2);
  const [ gridValue2, setGridValue2 ] = useState(6);
  
  
  const handleRotatingChange = (rotating) => {

    setIsRotating(rotating);
  };
  const handleDraggingChange = (dragging) => {
    setIsDragging(dragging);
  };
  const handleMarkerActive = (marker) => {
    setMarkerActive(marker);
  };
  
  const startPos = new THREE.Vector3(0,10,5);
  return (
    <div className="App">
      <Canvas camera={{position: [startPos.x,startPos.y,startPos.z]}} gl={{antialias: true}} style={{height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <OrbitControls enabled={!isRotating && !isDragging && !markerActive && !showSettings} makeDefault/>
        <spotLight position={[0,5,0]} intensity={10} color={0xffffff}/>
        <color attach="background" args={["#3057E1"]}/>
        <InfiniteGrid size1={gridValue1} size2={gridValue2} color={0xffffff} distance={fogLevel} axes="xzy"/>
        {!markerActive &&
          <GizmoHelper alignment="bottom-right" margin={[80,80]} >
            <GizmoViewport axisColors={["red", "green", "blue"]} labelColor="black" />
          </GizmoHelper>
        }
        <CubeR onDraggingChange={handleDraggingChange} onRotatingChange={handleRotatingChange} onMarkerActive={handleMarkerActive} onShowSettings={showSettings}/>
      </Canvas>
      <UserInterface 
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        fogLevel={fogLevel}
        setFogLevel={setFogLevel}
        gridValue1={gridValue1}
        setGridValue1={setGridValue1}
        gridValue2={gridValue2}
        setGridValue2={setGridValue2}
      />
    </div>

  )
}

export default App;