import { Settings, BookOpen, StickyNote, Star, MoveUpRight, Fullscreen } from "lucide-react";
import { useState } from "react";
import { Html } from "@react-three/drei";

const UserInterface = ({ showSettings, setShowSettings, fogLevel, setFogLevel, gridValue1, setGridValue1, gridValue2, setGridValue2, createBook }) => {
    return (
        <>
            <div className="userInterface">
                <button className="userInterface_settings_button" onClick={() => {setShowSettings(!showSettings)}}>
                    <Settings/> Settings
                </button>
                <div className="userInterface_inventory">
                    <button className="userInterface_inventory_item" onClick={createBook}><BookOpen/></button>
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
                                <input type="range" value={fogLevel} min="100" max="400" onChange={(e) => setFogLevel(e.target.value)}/>
                                {fogLevel}
                            </span>
                        </div>
                        <div className="item">
                            <span className="settingsMenu_itemName">
                                Grid1 
                            </span>
                            <span className="valueInput">
                                <input type="range" value={gridValue1} min="1" max="10" onChange={(e) => setGridValue1(e.target.value)}/>
                                {gridValue1}
                            </span>
                        </div>
                        <div className="item">
                            <span className="settingsMenu_itemName">
                                Grid2 
                            </span>
                            <span className="valueInput">
                                <input type="range" value={gridValue2} min="1" max="10" onChange={(e) => setGridValue2(e.target.value)}/>
                                {gridValue2}
                            </span>
                        </div>
                    </div>                    
                </div>
                }
            </div>
        </>    
    )
}

export default UserInterface;