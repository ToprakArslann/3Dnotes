import { Settings, BookOpen, StickyNote, Star, MoveUpRight, Fullscreen, BookOpenText, Import, FileUp, FileDown, RefreshCcw } from "lucide-react";
import { useState, useRef } from "react";
import { Html } from "@react-three/drei";

const UserInterface = ({ showSettings, setShowSettings, fogLevel, backgroundColor, setBackgroundColor, setFogLevel, gridValue1, setGridValue1, gridValue2, setGridValue2, createBook, createSticky, anyMarkerActive, exportScene, importScene, clearSScene, animations, setAnimations}) => {
    const fileInputRef = useRef(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    if (anyMarkerActive) return null;
    
    return (
        <>
            {!anyMarkerActive &&
                <div className="userInterface">
                    <button className="userInterface_settings_button" onClick={() => { setShowSettings(!showSettings) }}>
                        <Settings /> Settings
                    </button>
                    {!showSettings &&
                        <>
                            <div className="userInterface_inventory">
                                <button className="userInterface_inventory_item" onClick={createBook}><BookOpenText /></button>
                                <button className="userInterface_inventory_item" onClick={createSticky}><StickyNote /></button>
                            </div>
                            <div className="topLeft">
                                <button className="topLeftButton" onClick={exportScene}>
                                    <FileUp/> Export
                                </button>
                                <button className="topLeftButton" onClick={handleImportClick}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".json"
                                        onChange={importScene}
                                        style={{ display: 'none' }}
                                    />
                                    <FileDown/> Import
                                </button>
                                <button className="topLeftButton" onClick={clearSScene}>
                                    <RefreshCcw/> Clear
                                </button>
                            </div>
                        </>
                    }
                    <p className="footerText">Made with ❤️ by <a style={{ color: "Red" }} href="https://www.github.com/ToprakArslann">Toprak Arslan</a></p>
                    {showSettings &&
                        <div className="userInterface_settingsMenu">
                            <h1 className="userInterface_settingsMenu_header">Settings</h1>
                            <div className="userInterface_settingsMenu_items">
                                <div className="item">
                                    <span className="settingsMenu_itemName">Background Color <input type="color" className="colorPicker" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} /></span>
                                </div>
                                <div className="item">
                                    <span className="settingsMenu_itemName">
                                        Fog Level
                                    </span>
                                    <span className="valueInput">
                                        <input type="range" value={fogLevel} min="100" max="400" onChange={(e) => setFogLevel(e.target.value)} />
                                        {fogLevel}
                                    </span>
                                </div>
                                <div className="item">
                                    <span className="settingsMenu_itemName">
                                        Grid1
                                    </span>
                                    <span className="valueInput">
                                        <input type="range" value={gridValue1} min="1" max="10" onChange={(e) => setGridValue1(e.target.value)} />
                                        {gridValue1}
                                    </span>
                                </div>
                                <div className="item">
                                    <span className="settingsMenu_itemName">
                                        Grid2
                                    </span>
                                    <span className="valueInput">
                                        <input type="range" value={gridValue2} min="1" max="10" onChange={(e) => setGridValue2(e.target.value)} />
                                        {gridValue2}
                                    </span>
                                </div>
                                <div className="item">
                                    <span className="settingsMenu_itemName">
                                        Enable Animations
                                    </span>
                                    <input className="animationsCheck" type="checkbox" checked={animations} onChange={()=> setAnimations(!animations)}/>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            }
        </>
    )
}

export default UserInterface;