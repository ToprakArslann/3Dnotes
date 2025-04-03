import { Settings, BookOpen, StickyNote, Star, MoveUpRight, Fullscreen } from "lucide-react";
import { useState } from "react";
import { Html } from "@react-three/drei";

const UserInterface = () => {
    const [ showSettings, setShowSettings] = useState(false);

    return (
        <>
            <Html position={[0,0,0]} fullscreen>
                <div className="userInterface">
                    <button className="userInterface_settings_button" onClick={() => {setShowSettings(!showSettings)}}>
                        <Settings/> Settings
                    </button>
                    <div className="userInterface_inventory">
                        <button className="userInterface_inventory_item"><BookOpen/></button>
                        <button className="userInterface_inventory_item"><StickyNote/></button>
                        <button className="userInterface_inventory_item"><Star/></button>
                        <button className="userInterface_inventory_item"><MoveUpRight/></button>
                    </div>
                    {showSettings && 
                    <div className="userInterface_settingsMenu">
                        <h1 className="userInterface_settingsMenu_header">Settings</h1>
                        <div className="userInterface_settingsMenu_items">
                            <div className="item">
                                <span className="settingsMenu_itemName">Background Color</span>
                            </div>
                            <div className="item">
                                <span className="settingsMenu_itemName">
                                    Fog Level 
                                </span>
                                <span className="valueInput">
                                    <input className="settingsMenurange_range" type="range" value="200" min="100" max="400"/>
                                    200
                                </span>
                            </div>
                            <div className="item">
                                <span className="settingsMenu_itemName">
                                    Grid1 
                                </span>
                                <span className="valueInput">
                                    <input className="settingsMenurange_range" type="range" value="1" min="1" max="10"/>
                                    1
                                </span>
                            </div>
                            <div className="item">
                                <span className="settingsMenu_itemName">
                                    Grid2 
                                </span>
                                <span className="valueInput">
                                    <input className="settingsMenurange_range" type="range" value="10" min="1" max="10"/>
                                    10
                                </span>
                            </div>
                        </div>
                        
                    </div>
                    }
                </div>
            </Html>
        </>
    
    )
}

export default UserInterface;