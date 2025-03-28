import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Edges } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const CubeR = ({onDraggingChange}) => {
  const meshRef = useRef();
  const [selected, setSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const {camera, gl, controls} = useThree();
  const plane = new THREE.Plane(new THREE.Vector3(0,1,0), 2);

  useEffect(() => {
    onDraggingChange(isDragging);
  },[isDragging, onDraggingChange]);
  useEffect(() => {
    const handleMouseMove = (event) => {
      if(!isDragging || !meshRef.current) return;

      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse,camera);
      const point = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane,point);

      meshRef.current.position.set(point.x, 2, point.z);
    
    
    };

    const handleMouseUp = () =>{ setIsDragging(false);
      if(controls) controls.enabled = true;
    };

    if(isDragging){
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      if(controls) controls.enabled = false;
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, camera,gl, controls]);
  return(
    <mesh ref={meshRef} position={[0,2,0]} onClick={(e) => {
      e.stopPropagation();
      setSelected(!selected);
    }}>
      <boxGeometry args={[5,0.5,3]}/>
      <meshLambertMaterial color="595959" emissive={"#595959"}/>
    
      {selected && (
        <>
          <Edges>
            <lineSegments>
              <edgesGeometry attach="geometry" args={[meshRef.current.geometry]} />
              <lineBasicMaterial color={"0xff0000"}/>
            </lineSegments>
          </Edges>
          <Html position={[0,0.3,0]}>
            <button style={{
              background: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              border: "none",
              cursor: "grab",
              transform: "translateX(-50%)",
            }}
            onMouseDown={(e) =>{
              e.stopPropagation();
              setIsDragging(true);
            }}
            onMouseUp={() => setIsDragging(false)}
            >
              {isDragging ? "Moving..." : "Move"}
            </button>
          </Html>
        </>
      )}
    </mesh>
  )
}


const App = () => {
  const [isDragging, setIsDragging] = useState(false);
  const handleDraggingChange = (dragging) => {
    setIsDragging(dragging);
  };

  return (
    <Canvas gl={{antialias: true}} style={{height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <OrbitControls enabled={!isDragging} />
      <spotLight position={[0,5,0]} intensity={10} color={0xffffff}/>
      <color attach="background" args={["#000000"]}/>
      <gridHelper args={[1000,500,'red', 'white']}/>
      <CubeR onDraggingChange={handleDraggingChange}/>
    </Canvas>
  )
}

export default App;
