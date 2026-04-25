import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Sound Engine using Web Audio API
const playSound = (type) => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const t = ctx.currentTime;
        
        const playTone = (f, oscType, dur, start, vol=0.1) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = oscType;
            osc.frequency.setValueAtTime(f, start);
            gain.gain.setValueAtTime(vol, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + dur);
        };

        if (type === 'click') {
            playTone(800, 'sine', 0.05, t, 0.05);
        } else if (type === 'startup') {
            playTone(440, 'triangle', 0.5, t);
            playTone(554, 'triangle', 0.5, t + 0.1);
            playTone(659, 'triangle', 0.5, t + 0.2);
            playTone(880, 'triangle', 1.0, t + 0.3);
        } else if (type === 'shutdown') {
            playTone(880, 'sawtooth', 0.3, t);
            playTone(659, 'sawtooth', 0.3, t + 0.15);
            playTone(554, 'sawtooth', 0.3, t + 0.3);
            playTone(440, 'sawtooth', 0.8, t + 0.45);
        } else if (type === 'open') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.1);
        } else if (type === 'close') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.1);
        }
    } catch(e) { console.warn("Audio not supported or blocked"); }
};

// Virtual file system helpers
const getVfsNode = (fs, path) => {
  const parts = path === '/' ? [] : path.split('/').filter(Boolean);
  let node = fs['/'];
  for (const part of parts) {
    if (!node || !node.children || !node.children[part]) return null;
    node = node.children[part];
  }
  return node;
};

const getFileIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  const map = { txt: '📝', js: '📜', jsx: '📜', ts: '📜', tsx: '📜', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', pdf: '📕', html: '🌐', css: '🎨', json: '📋', md: '📋' };
  return map[ext] || '📄';
};

const ICONS = [
  { id: 'about', label: 'About Me', icon: '👤' },
  { id: 'projects', label: 'Projects', icon: '📁' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'paint', label: 'Paint', icon: '🎨' },
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'camera', label: 'Camera', icon: '📷' },
  { id: 'contact', label: 'Contact', icon: '📧' },
  { id: 'terminal', label: 'Terminal', icon: '⌨️' },
  { id: 'notepad', label: 'Notepad', icon: '📝' },
  { id: 'calculator', label: 'Calculator', icon: '🧮' },
  { id: 'recycle', label: 'Recycle Bin', icon: '🗑️' }
];

function App() {
  const [isPoweredOn, setIsPoweredOn] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [openWindows, setOpenWindows] = useState([]);
  const [activeWindow, setActiveWindow] = useState(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [zIndexCounter, setZIndexCounter] = useState(100);
  const [vfs, setVfs] = useState({ '/': { type: 'dir', children: {} } });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePowerOn = () => {
    playSound('startup');
    setIsPoweredOn(true);
    setIsShuttingDown(false);
    setOpenWindows([]);
  };

  const handleShutDown = () => {
    playSound('shutdown');
    setStartMenuOpen(false);
    setIsShuttingDown(true);
    setTimeout(() => {
        setIsPoweredOn(false);
    }, 1500); // Wait for animation and sound
  };

  const handleOpenWindow = (id) => {
    if (!openWindows.find(w => w.id === id)) {
      playSound('open');
      setOpenWindows([...openWindows, { id, minimized: false, maximized: false, zIndex: zIndexCounter, pos: { x: 50 + (openWindows.length * 20), y: 50 + (openWindows.length * 20) } }]);
    } else {
      playSound('click');
    }
    setActiveWindow(id);
    setZIndexCounter(prev => prev + 1);
    setStartMenuOpen(false);
    
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: false, zIndex: zIndexCounter } : w));
  };

  const handleCloseWindow = (id) => {
    playSound('close');
    setOpenWindows(openWindows.filter(w => w.id !== id));
    if (activeWindow === id) setActiveWindow(null);
  };

  const handleMinimizeWindow = (id) => {
    playSound('click');
    setOpenWindows(openWindows.map(w => w.id === id ? { ...w, minimized: true } : w));
    setActiveWindow(null);
  };

  const handleMaximizeWindow = (id) => {
    playSound('click');
    setOpenWindows(openWindows.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w));
  };

  const focusWindow = (id) => {
    playSound('click');
    setActiveWindow(id);
    setZIndexCounter(prev => prev + 1);
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: false, zIndex: zIndexCounter } : w));
  };

  const updateWindowPos = (id, pos) => {
      setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, pos } : w));
  };

  const handleOpenVfsItem = (name, node) => {
    if (node.type === 'dir') {
      const winId = `explorer::/${name}`;
      handleOpenWindow(winId);
    }
  };

  if (!isPoweredOn) {
      return (
          <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <button 
                  onClick={handlePowerOn}
                  style={{ padding: '20px 40px', fontSize: '24px', cursor: 'pointer', background: '#333', color: '#fff', border: '2px solid #555', borderRadius: '10px' }}
              >
                  Power On
              </button>
          </div>
      );
  }

  return (
    <div className={`desktop ${isShuttingDown ? 'shutting-down' : ''}`} onClick={() => setStartMenuOpen(false)}>
      {/* Desktop Icons - Using flexbox to auto arrange them and override absolute classes */}
      <div style={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', height: 'calc(100vh - 60px)', alignContent: 'flex-start', padding: '10px', gap: '15px' }}>
          {ICONS.map((icon) => (
            <div
              key={icon.id}
              className="icon"
              style={{ position: 'relative', width: '80px', top: 'auto', left: 'auto' }}
              onClick={(e) => { e.stopPropagation(); playSound('click'); }}
              onDoubleClick={(e) => { e.stopPropagation(); handleOpenWindow(icon.id); }}
            >
              <img src={`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect width='48' height='48' fill='%23fff' opacity='0.2'/><text x='24' y='28' text-anchor='middle' fill='%23fff' font-size='15'>${icon.icon}</text></svg>`} alt={icon.label} />
              <div style={{ whiteSpace: 'nowrap' }}>{icon.label}</div>
            </div>
          ))}
          {Object.entries(vfs['/'].children).map(([name, node]) => {
            const emoji = node.type === 'dir' ? '📂' : getFileIcon(name);
            return (
              <div
                key={`vfs-${name}`}
                className="icon"
                style={{ position: 'relative', width: '80px', top: 'auto', left: 'auto' }}
                onClick={(e) => { e.stopPropagation(); playSound('click'); }}
                onDoubleClick={(e) => { e.stopPropagation(); handleOpenVfsItem(name, node); }}
              >
                <div style={{ fontSize: '32px', lineHeight: 1, marginBottom: '4px', textAlign: 'center' }}>{emoji}</div>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '78px', fontSize: '11px', textAlign: 'center' }}>{name}</div>
              </div>
            );
          })}
      </div>

      {/* Windows */}
      {openWindows.map((win) => (
        <Window
          key={win.id}
          id={win.id}
          winState={win}
          isActive={activeWindow === win.id}
          onClose={() => handleCloseWindow(win.id)}
          onMinimize={() => handleMinimizeWindow(win.id)}
          onMaximize={() => handleMaximizeWindow(win.id)}
          onFocus={() => focusWindow(win.id)}
          updatePos={updateWindowPos}
          fsProps={win.id === 'terminal' || win.id.startsWith('explorer::') ? { vfs, setVfs } : undefined}
        />
      ))}

      {/* Taskbar */}
      <div className="taskbar" onClick={(e) => { e.stopPropagation(); if(!startMenuOpen) playSound('click'); }}>
        <button className="start-button" onClick={(e) => { e.stopPropagation(); playSound('click'); setStartMenuOpen(!startMenuOpen); }}>
          Start
        </button>
        {startMenuOpen && (
          <div className="start-menu open">
            <ul>
              {ICONS.map(icon => (
                <li key={icon.id} onClick={(e) => { e.stopPropagation(); setStartMenuOpen(false); handleOpenWindow(icon.id); }}>{icon.icon} {icon.label}</li>
              ))}
              <li style={{borderTop: '1px solid #333', marginTop: '5px', paddingTop: '5px', color: '#ff5555'}} onClick={(e) => { e.stopPropagation(); handleShutDown(); }}>
                  ⏻ Shut Down...
              </li>
            </ul>
          </div>
        )}
        <div className="taskbar-apps">
          {openWindows.map(win => (
             <div
               key={`taskbar-${win.id}`}
               className={`app-button ${activeWindow === win.id ? 'active' : ''}`}
               onClick={(e) => { e.stopPropagation(); focusWindow(win.id); }}
             >
               {win.id.startsWith('explorer::') ? '📂' : ICONS.find(i => i.id === win.id)?.icon} {win.id.startsWith('explorer::') ? win.id.split('/').pop() : win.id.charAt(0).toUpperCase() + win.id.slice(1)}
             </div>
          ))}
        </div>
        <div className="clock">{time}</div>
      </div>
    </div>
  );
}

// Window Component Header Drag handling
const WindowTitleBar = ({ title, onClose, onMinimize, onMaximize, onFocus, updatePos, winState }) => {
    const handleMouseDown = (e) => {
      onFocus();
      const startX = e.clientX;
      const startY = e.clientY;
      const initialWindowX = winState.pos.x;
      const initialWindowY = winState.pos.y;

      const handleMouseMove = (moveEvent) => {
        if (!winState.maximized) {
            updatePos(winState.id, {
                x: initialWindowX + (moveEvent.clientX - startX),
                y: initialWindowY + (moveEvent.clientY - startY)
            });
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="window-titlebar" onMouseDown={handleMouseDown}>
            <span>{title}</span>
            <div className="window-titlebar-controls" onMouseDown={(e) => e.stopPropagation()}>
                <button className="control-btn" onClick={onMinimize}>−</button>
                <button className="control-btn" onClick={onMaximize}>□</button>
                <button className="control-btn close-btn" onClick={onClose}>×</button>
            </div>
        </div>
    );
};

// Main Window Component
const Window = ({ id, winState, isActive, onClose, onMinimize, onMaximize, onFocus, updatePos, fsProps }) => {
  const getStyle = () => {
    if (winState.minimized) {
        return { display: 'none' };
    }
    if (winState.maximized) {
        return {
            left: 0, top: 0, width: '100vw', height: 'calc(100vh - 40px)', zIndex: winState.zIndex
        };
    }
    return {
        left: winState.pos.x + 'px',
        top: winState.pos.y + 'px',
        zIndex: winState.zIndex,
    };
  };

  const title = id.startsWith('explorer::')
    ? `📂 ${id.split('/').pop()}`
    : id.charAt(0).toUpperCase() + id.slice(1);

  return (
    <div
      className={`window ${isActive ? 'active' : ''}`}
      style={getStyle()}
      onMouseDown={onFocus}
    >
      <WindowTitleBar
        title={title}
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        onFocus={onFocus}
        updatePos={updatePos}
        winState={winState}
      />
      <div className="window-content" style={{ height: 'calc(100% - 20px)', boxSizing: 'border-box', overflow: 'hidden', padding: 0 }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ padding: '10px', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
            <WindowContent id={id} fsProps={fsProps} />
        </div>
      </div>
    </div>
  );
};

// Generic content dispatcher
const WindowContent = ({ id, fsProps }) => {
  if (id.startsWith('explorer::')) {
    const path = id.slice('explorer::'.length);
    return <FileExplorerContent initialPath={path} fsProps={fsProps} />;
  }
  switch (id) {
    case 'about': return <AboutContent />;
    case 'projects': return <ProjectsContent />;
    case 'skills': return <SkillsContent />;
    case 'contact': return <ContactContent />;
    case 'paint': return <PaintContent />;
    case 'games': return <GamesContent />;
    case 'camera': return <CameraContent />;
    case 'terminal': return <TerminalContent fsProps={fsProps} />;
    case 'notepad': return <NotepadContent />;
    case 'calculator': return <CalculatorContent />;
    case 'recycle': return <RecycleBinContent />;
    default: return <div>Unknown Window</div>;
  }
};

/* --- Existing App Components --- */

const AboutContent = () => (
    <>
        <h2>John Doe</h2>
        <p>Full-Stack Developer passionate about creating innovative web experiences. With 5+ years in the industry, I specialize in HTML, CSS, JS, and more.</p>
        <ul>
            <li>Experience: 5 years</li>
            <li>Location: San Francisco</li>
            <li>Email: john@example.com</li>
        </ul>
    </>
);

const ProjectsContent = () => (
    <>
        <h2>My Projects</h2>
        <ul>
            <li><strong>Project 1:</strong> A responsive e-commerce site built with React.</li>
            <li><strong>Project 2:</strong> OS-like portfolio (this one!) using React.</li>
            <li><strong>Project 3:</strong> Data visualization dashboard with D3.js.</li>
        </ul>
        <p>View on GitHub: <a href="#" style={{color: '#00ff00'}}>github.com/johndoe</a></p>
    </>
);

const SkillsContent = () => (
    <>
        <h2>Technical Skills</h2>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <tbody>
                <tr><td>HTML/CSS</td><td>Expert</td></tr>
                <tr><td>JavaScript</td><td>Advanced</td></tr>
                <tr><td>React</td><td>Intermediate</td></tr>
                <tr><td>Node.js</td><td>Intermediate</td></tr>
                <tr><td>Python</td><td>Basic</td></tr>
            </tbody>
        </table>
    </>
);

const ContactContent = () => (
    <>
        <h2>Get in Touch</h2>
        <p>Let's collaborate! Reach out via:</p>
        <ul>
            <li>Email: <a href="mailto:john@example.com" style={{color: '#00ff00'}}>john@example.com</a></li>
            <li>LinkedIn: <a href="#" style={{color: '#00ff00'}}>linkedin.com/in/johndoe</a></li>
            <li>Phone: (123) 456-7890</li>
        </ul>
    </>
);

const PaintContent = () => {
    const canvasRef = useRef(null);
    const [color, setColor] = useState('#000000');
    const isDrawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        playSound('click');
        isDrawing.current = true;
        lastPos.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    };

    const handleMouseMove = (e) => {
        if (!isDrawing.current) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        lastPos.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    };

    const handleMouseUpOrOut = () => {
        isDrawing.current = false;
    };

    const clearCanvas = () => {
        playSound('click');
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div>
            <h2>Paint</h2>
            <canvas
                ref={canvasRef}
                id="paint-canvas"
                width="280"
                height="200"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrOut}
                onMouseOut={handleMouseUpOrOut}
            />
            <br />
            <button onClick={clearCanvas}>Clear</button>
            <label>Color: <input type="color" value={color} onChange={(e) => { playSound('click'); setColor(e.target.value); }} /></label>
        </div>
    );
};

const GamesContent = () => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [player, setPlayer] = useState('X');
    const [winner, setWinner] = useState(null);

    const checkWinner = (squares) => {
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    };

    const handleClick = (i) => {
        playSound('click');
        if (board[i] || winner) return;
        const newBoard = [...board];
        newBoard[i] = player;
        setBoard(newBoard);
        
        const newWinner = checkWinner(newBoard);
        if (newWinner) {
            setWinner(newWinner);
        } else {
            setPlayer(player === 'X' ? 'O' : 'X');
        }
    };

    const resetGame = () => {
        playSound('click');
        setBoard(Array(9).fill(null));
        setPlayer('X');
        setWinner(null);
    };

    return (
        <div>
            <h2>Tic-Tac-Toe</h2>
            <div className="tic-tac-toe">
                {board.map((cell, i) => (
                    <div key={i} className="tic-cell" onClick={() => handleClick(i)}>
                        {cell}
                    </div>
                ))}
            </div>
            <p>
                {winner ? `Player ${winner} wins!` : `Player ${player}'s turn`}
            </p>
            <button onClick={resetGame}>New Game</button>
        </div>
    );
};

const CameraContent = () => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    
    const startCamera = async () => {
        playSound('click');
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(s);
            if (videoRef.current) {
                videoRef.current.srcObject = s;
            }
        } catch (err) {
            console.error('Camera error:', err);
        }
    };

    const stopCamera = () => {
        playSound('click');
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    };

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    return (
        <div>
            <h2>Camera App</h2>
            <video ref={videoRef} id="camera-video" autoPlay playsInline></video>
            <br />
            <button onClick={startCamera}>Start Camera</button>
            <button onClick={stopCamera}>Stop Camera</button>
            <p>(Grant permission for webcam access)</p>
        </div>
    );
};


/* --- FILE EXPLORER --- */

const explorerItemStyle = {
  width: '88px', display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '8px 4px', cursor: 'pointer', borderRadius: '6px', border: '2px solid transparent',
  userSelect: 'none',
};

const FileExplorerContent = ({ initialPath, fsProps }) => {
  const { vfs } = fsProps || {};
  const [currentPath, setCurrentPath] = useState(initialPath || '/');
  const [selected, setSelected] = useState(null);

  const node = vfs ? getVfsNode(vfs, currentPath) : null;
  const items = node?.children ? Object.entries(node.children) : [];
  const breadcrumbs = currentPath === '/' ? [] : currentPath.split('/').filter(Boolean);

  const navigate = (name) => {
    setSelected(null);
    setCurrentPath(currentPath === '/' ? '/' + name : currentPath + '/' + name);
  };

  const goTo = (idx) => {
    setSelected(null);
    if (idx < 0) { setCurrentPath('/'); return; }
    setCurrentPath('/' + breadcrumbs.slice(0, idx + 1).join('/'));
  };

  const goUp = () => {
    if (currentPath === '/') return;
    const p = currentPath.split('/').filter(Boolean);
    p.pop();
    setCurrentPath(p.length === 0 ? '/' : '/' + p.join('/'));
  };

  return (
    <div style={{ height: '100%', margin: '-10px', display: 'flex', flexDirection: 'column', background: '#fff', color: '#222', fontFamily: 'Arial, sans-serif' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <button onClick={goUp} disabled={currentPath === '/'} style={{ padding: '3px 10px', cursor: currentPath === '/' ? 'default' : 'pointer', fontSize: '13px', background: '#e0e0e0', border: '1px solid #bbb', borderRadius: '3px' }}>↑ Up</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '13px', flexGrow: 1 }}>
          <span style={{ cursor: 'pointer', color: '#0066cc', fontWeight: 'bold' }} onClick={() => goTo(-1)}>~</span>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <span style={{ color: '#888' }}> / </span>
              <span style={{ cursor: 'pointer', color: '#0066cc' }} onClick={() => goTo(i)}>{crumb}</span>
            </React.Fragment>
          ))}
        </div>
        <span style={{ fontSize: '12px', color: '#888' }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>

      {/* File grid */}
      <div
        style={{ flexGrow: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '8px', alignContent: 'flex-start' }}
        onClick={() => setSelected(null)}
      >
        {items.length === 0 && (
          <div style={{ width: '100%', textAlign: 'center', color: '#aaa', marginTop: '50px', fontSize: '14px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
            This folder is empty
          </div>
        )}
        {items.map(([name, n]) => {
          const emoji = n.type === 'dir' ? '📂' : getFileIcon(name);
          const isSelected = selected === name;
          return (
            <div
              key={name}
              style={{
                ...explorerItemStyle,
                background: isSelected ? '#cce5ff' : 'transparent',
                border: isSelected ? '2px solid #66aaff' : '2px solid transparent',
              }}
              onClick={(e) => { e.stopPropagation(); playSound('click'); setSelected(name); }}
              onDoubleClick={() => { if (n.type === 'dir') navigate(name); }}
            >
              <div style={{ fontSize: '40px', lineHeight: 1, marginBottom: '5px' }}>{emoji}</div>
              <div style={{ fontSize: '12px', textAlign: 'center', wordBreak: 'break-word', maxWidth: '84px', lineHeight: '1.3', color: '#222' }}>{name}</div>
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      <div style={{ padding: '4px 10px', background: '#f0f0f0', borderTop: '1px solid #ccc', fontSize: '11px', color: '#666' }}>
        {selected ? `Selected: ${selected}` : `${items.length} object${items.length !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
};

/* --- NEW CRAZY APPLICATIONS --- */

const TerminalContent = ({ fsProps }) => {
    const { vfs, setVfs } = fsProps || {};
    const [history, setHistory] = useState(['OS Terminal v1.0.0', 'Type "help" to see available commands.']);
    const [input, setInput] = useState('');
    const [currentPath, setCurrentPath] = useState('/');
    const endRef = useRef(null);

    const resolvePath = (target) => {
        if (!target || target === '.') return currentPath;
        if (target === '~') return '/';
        if (target === '..') {
            if (currentPath === '/') return '/';
            const p = currentPath.split('/').filter(Boolean);
            p.pop();
            return p.length === 0 ? '/' : '/' + p.join('/');
        }
        if (target.startsWith('/')) return target;
        return currentPath === '/' ? '/' + target : currentPath + '/' + target;
    };

    const prompt = `user@os:${currentPath === '/' ? '~' : currentPath}$`;

    const handleCommand = (e) => {
        if (e.key !== 'Enter') return;
        playSound('click');
        const raw = input.trim();
        const parts = raw.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const newHist = [...history, `${prompt} ${raw}`];

        if (cmd === 'help') {
            newHist.push('Commands: help, clear, date, whoami, echo, pwd, ls, mkdir, touch, cd, rm, sudo, matrix, rickroll');
        } else if (cmd === 'clear') {
            setHistory([]);
            setInput('');
            return;
        } else if (cmd === 'date') {
            newHist.push(new Date().toString());
        } else if (cmd === 'whoami') {
            newHist.push('root (just kidding, you are guest)');
        } else if (cmd === 'echo') {
            newHist.push(parts.slice(1).join(' '));
        } else if (cmd === 'sudo') {
            newHist.push('Nice try! This incident will be reported to Santa 🎅.');
        } else if (cmd === 'matrix') {
            newHist.push('Wake up, Neo...\nThe Matrix has you...\nFollow the white rabbit.');
        } else if (cmd === 'rickroll') {
            newHist.push('Never gonna give you up\nNever gonna let you down\nNever gonna run around and desert you');
        } else if (cmd === 'pwd') {
            newHist.push(currentPath);
        } else if (cmd === 'ls') {
            if (!vfs) { newHist.push('(filesystem unavailable)'); }
            else {
                const node = getVfsNode(vfs, currentPath);
                if (node && node.children) {
                    const items = Object.entries(node.children);
                    if (items.length === 0) newHist.push('(empty)');
                    else items.forEach(([name, n]) => newHist.push(`${n.type === 'dir' ? '📂' : getFileIcon(name)}  ${name}${n.type === 'dir' ? '/' : ''}`));
                }
            }
        } else if (cmd === 'mkdir') {
            if (!parts[1]) { newHist.push('Usage: mkdir <name>'); }
            else if (!vfs) { newHist.push('(filesystem unavailable)'); }
            else {
                const name = parts[1];
                const node = getVfsNode(vfs, currentPath);
                if (node.children[name]) {
                    newHist.push(`mkdir: ${name}: File exists`);
                } else {
                    setVfs(prev => {
                        const next = JSON.parse(JSON.stringify(prev));
                        getVfsNode(next, currentPath).children[name] = { type: 'dir', children: {} };
                        return next;
                    });
                    newHist.push(`Created directory: ${name}${currentPath === '/' ? ' (visible on desktop)' : ''}`);
                }
            }
        } else if (cmd === 'touch') {
            if (!parts[1]) { newHist.push('Usage: touch <filename>'); }
            else if (!vfs) { newHist.push('(filesystem unavailable)'); }
            else {
                const name = parts[1];
                setVfs(prev => {
                    const next = JSON.parse(JSON.stringify(prev));
                    const node = getVfsNode(next, currentPath);
                    if (!node.children[name]) node.children[name] = { type: 'file' };
                    return next;
                });
                newHist.push(`Created file: ${name}${currentPath === '/' ? ' (visible on desktop)' : ''}`);
            }
        } else if (cmd === 'cd') {
            if (!vfs) { newHist.push('(filesystem unavailable)'); }
            else {
                const target = parts[1] || '/';
                const newPath = resolvePath(target);
                const node = getVfsNode(vfs, newPath);
                if (!node) newHist.push(`cd: ${target}: No such file or directory`);
                else if (node.type !== 'dir') newHist.push(`cd: ${target}: Not a directory`);
                else setCurrentPath(newPath);
            }
        } else if (cmd === 'rm') {
            if (!parts[1]) { newHist.push('Usage: rm <name>'); }
            else if (!vfs) { newHist.push('(filesystem unavailable)'); }
            else {
                const name = parts[1];
                const node = getVfsNode(vfs, currentPath);
                if (!node.children[name]) {
                    newHist.push(`rm: ${name}: No such file or directory`);
                } else {
                    setVfs(prev => {
                        const next = JSON.parse(JSON.stringify(prev));
                        delete getVfsNode(next, currentPath).children[name];
                        return next;
                    });
                    newHist.push(`Removed: ${name}`);
                }
            }
        } else if (raw !== '') {
            newHist.push(`Command not found: ${cmd}. Type "help" for commands.`);
        }

        setHistory(newHist);
        setInput('');
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 10);
    };

    return (
        <div style={{ backgroundColor: '#0c0c0c', color: '#0f0', fontFamily: 'monospace', height: '100%', margin: '-10px', padding: '10px', boxSizing: 'border-box', overflowY: 'auto' }} onClick={() => document.getElementById('term-input')?.focus()}>
            {history.map((line, i) => <div key={i} style={{ whiteSpace: 'pre-wrap', marginBottom: '4px' }}>{line}</div>)}
            <div style={{ display: 'flex', marginTop: '5px' }}>
                <span style={{ marginRight: '8px' }}>{prompt}</span>
                <input
                    id="term-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleCommand}
                    style={{ background: 'transparent', color: '#0f0', border: 'none', outline: 'none', flexGrow: 1, fontFamily: 'monospace', fontSize: '14px' }}
                    autoComplete="off"
                    autoFocus
                />
            </div>
            <div ref={endRef} />
        </div>
    );
};

const NotepadContent = () => {
    const [text, setText] = useState("Start typing your notes here...");

    const handleSavePDF = async () => {
        playSound('click');
        try {
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF();
            const splitText = doc.splitTextToSize(text, 180);
            doc.text(splitText, 10, 10);
            doc.save("notepad-note.pdf");
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: '-10px', backgroundColor: '#fff', color: '#000' }}>
            <div style={{ borderBottom: '1px solid #ccc', padding: '5px', background: '#f0f0f0', color: '#000', fontSize: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{cursor:'pointer'}} onClick={handleSavePDF}>💾 Save as PDF</span>
                <span style={{cursor:'pointer'}}>Edit</span>
                <span style={{cursor:'pointer'}}>Format</span>
                <span style={{cursor:'pointer'}}>Help</span>
            </div>
            <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ flexGrow: 1, resize: 'none', border: 'none', outline: 'none', padding: '10px', fontFamily: 'Arial, sans-serif', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} 
            />
        </div>
    );
};

const CalculatorContent = () => {
    const [calc, setCalc] = useState("");
    const [result, setResult] = useState("");

    const ops = ['/', '*', '+', '-', '.'];

    const updateCalc = value => {
        playSound('click');
        if (
            ops.includes(value) && calc === '' || 
            ops.includes(value) && ops.includes(calc.slice(-1))
        ) {
            return;
        }
        setCalc(calc + value);
        if (!ops.includes(value)) {
            try { setResult(eval(calc + value).toString()); } catch(e) {}
        }
    };

    const calculate = () => {
        playSound('click');
        try {
            setCalc(eval(calc).toString());
            setResult('');
        } catch(e) {
            setCalc('Error');
        }
    };

    const deleteLast = () => {
        playSound('click');
        if (calc === '') return;
        const value = calc.slice(0, -1);
        setCalc(value);
        try { setResult(eval(value).toString()); } catch(e) { setResult(''); }
    };

    const clear = () => {
        playSound('click');
        setCalc('');
        setResult('');
    };

    const calcBtnStyle = { padding: '15px', fontSize: '18px', cursor: 'pointer', border: '1px solid #444', background: '#333', color: '#fff', borderRadius: '3px' };

    return (
        <div style={{ background: '#222', margin: '-10px', padding: '15px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#a5d6a7', borderRadius: '5px', padding: '10px', textAlign: 'right', fontSize: '30px', marginBottom: '15px', color: '#000', wordWrap: 'break-word', minHeight: '40px', display: 'flex', flexDirection:'column', justifyContent: 'flex-end' }}>
                {result ? <span style={{ fontSize: '14px', color: '#444' }}>({result})</span> : ''}
                <span>{calc || "0"}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', flexGrow: 1 }}>
                <button onClick={clear} style={{...calcBtnStyle, background: '#d32f2f'}}>C</button>
                <button onClick={() => updateCalc('/')} style={{...calcBtnStyle, background: '#f57c00'}}>/</button>
                <button onClick={() => updateCalc('*')} style={{...calcBtnStyle, background: '#f57c00'}}>*</button>
                <button onClick={deleteLast} style={{...calcBtnStyle, background: '#7b1fa2'}}>DEL</button>

                <button onClick={() => updateCalc('7')} style={calcBtnStyle}>7</button>
                <button onClick={() => updateCalc('8')} style={calcBtnStyle}>8</button>
                <button onClick={() => updateCalc('9')} style={calcBtnStyle}>9</button>
                <button onClick={() => updateCalc('-')} style={{...calcBtnStyle, background: '#f57c00'}}>-</button>

                <button onClick={() => updateCalc('4')} style={calcBtnStyle}>4</button>
                <button onClick={() => updateCalc('5')} style={calcBtnStyle}>5</button>
                <button onClick={() => updateCalc('6')} style={calcBtnStyle}>6</button>
                <button onClick={() => updateCalc('+')} style={{...calcBtnStyle, background: '#f57c00'}}>+</button>

                <button onClick={() => updateCalc('1')} style={calcBtnStyle}>1</button>
                <button onClick={() => updateCalc('2')} style={calcBtnStyle}>2</button>
                <button onClick={() => updateCalc('3')} style={calcBtnStyle}>3</button>
                <button onClick={calculate} style={{...calcBtnStyle, gridRow: 'span 2', background: '#1976d2'}}>=</button>

                <button onClick={() => updateCalc('0')} style={{...calcBtnStyle, gridColumn: 'span 2'}}>0</button>
                <button onClick={() => updateCalc('.')} style={calcBtnStyle}>.</button>
            </div>
        </div>
    );
};

const RecycleBinContent = () => {
    const [files, setFiles] = useState([
        { name: 'old_project_v1.zip', size: '14.2 MB' },
        { name: 'resume_2022_final_FINAL.pdf', size: '1.1 MB' },
        { name: 'passwords.txt', size: '4 KB' },
        { name: 'untitled.png', size: '2.4 MB' },
        { name: 'homework_folder', size: '140 GB' }
    ]);

    const emptyBin = () => {
        playSound('shutdown'); // dramatic sound for emptying bin
        setFiles([]);
    };

    return (
        <div style={{ height: '100%', margin: '-10px', background: '#fff', color: '#000', padding: '10px', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>🗑️ Recycle Bin</span>
                <button onClick={emptyBin} disabled={files.length === 0} style={{ padding: '8px 15px', cursor: files.length > 0 ? 'pointer' : 'not-allowed', background: files.length > 0 ? '#d32f2f' : '#ccc', color: '#fff', border: 'none', borderRadius: '4px' }}>
                    Empty Bin
                </button>
            </div>
            
            {files.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '60px', color: '#666' }}>
                    <div style={{ fontSize: '50px', marginBottom: '10px' }}>✨</div>
                    <div style={{ fontSize: '18px' }}>The recycle bin is completely empty.</div>
                    <div style={{ fontSize: '12px', marginTop: '10px', fontStyle: 'italic' }}>Your OS feels much lighter now!</div>
                </div>
            ) : (
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #ddd', background: '#f5f5f5' }}>
                            <th style={{ padding: '8px' }}>Name</th>
                            <th style={{ padding: '8px' }}>Size</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((f, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px 8px' }}>📄 {f.name}</td>
                                <td style={{ padding: '10px 8px', color: '#666' }}>{f.size}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default App;
