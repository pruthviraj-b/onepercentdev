'use client';

import React, { useState, useEffect } from 'react';

interface InteractiveBlueprintProps {
  courseId: string;
  part: number;
}

interface NodeDetail {
  id: string;
  name: string;
  role: string;
  ports: string;
  protocols: string;
  physicalVsVirtual: string;
  description: string;
}

export function InteractiveBlueprint({ courseId, part }: InteractiveBlueprintProps) {
  const [selectedNode, setSelectedNode] = useState<string>('client');
  const [packetState, setPacketState] = useState<'idle' | 'traveling' | 'processing' | 'returning' | 'done'>('idle');
  const [packetPosition, setPacketPosition] = useState({ x: 70, y: 150 });
  const [packetLog, setPacketLog] = useState<string[]>([]);
  
  // Python simulation states
  const [ram, setRam] = useState<number[]>([15, 27, 0, 0, 0, 0, 0, 0]);
  const [regA, setRegA] = useState<number>(0);
  const [regB, setRegB] = useState<number>(0);
  const [aluResult, setAluResult] = useState<number>(0);
  const [pythonStep, setPythonStep] = useState<number>(0);
  const [isPythonRunning, setIsPythonRunning] = useState<boolean>(false);
  const [pythonLog, setPythonLog] = useState<string[]>([]);

const isDataAnalyst = courseId.startsWith('data-analyst');

  // Auto-select node based on chapters
  useEffect(() => {
    if (courseId === 'cloud') {
      if (part === 7) setSelectedNode('router');
      else if (part === 14) setSelectedNode('server');
      else if (part === 19) setSelectedNode('server');
      else if (part === 23) setSelectedNode('loadbalancer');
    } else if (isDataAnalyst) {
      if (part <= 7) setSelectedNode('datasource'); // Excel
      else if (part <= 19) setSelectedNode('python'); // Python/Pandas
      else if (part <= 27) setSelectedNode('sql'); // SQL
      else setSelectedNode('tableau'); // Tableau
    }
  }, [courseId, part, isDataAnalyst]);

  const dataNodes: Record<string, NodeDetail> = {
    datasource: {
      id: 'datasource',
      name: 'Raw Data Source',
      role: 'Stores unstructured or messy raw data from the real world.',
      ports: 'N/A',
      protocols: 'CSV, JSON, APIs',
      physicalVsVirtual: 'Often unoptimized flat files sitting on a hard drive.',
      description: 'The beginning of the data pipeline. Data here is chaotic, containing nulls and errors that must be cleaned.'
    },
    python: {
      id: 'python',
      name: 'Python (Pandas ETL)',
      role: 'Extracts, Transforms, and Loads (ETL) the messy data into a clean structure.',
      ports: 'Local Memory',
      protocols: 'C-optimized NumPy Arrays',
      physicalVsVirtual: 'Runs in RAM using contiguous memory allocation for speed.',
      description: 'The engine room. Python scripts clean missing values, merge datasets, and prepare the data for long-term relational storage.'
    },
    sql: {
      id: 'sql',
      name: 'Data Warehouse (SQL)',
      role: 'Stores clean, structured data in a strict relational schema.',
      ports: '5432, 3306',
      protocols: 'TCP, SQL',
      physicalVsVirtual: 'A massive relational database server (PostgreSQL, Snowflake).',
      description: 'The fortress of truth. Data here is perfectly typed and normalized to prevent update anomalies.'
    },
    tableau: {
      id: 'tableau',
      name: 'BI Dashboard (Tableau)',
      role: 'Visualizes the data for executive decision making.',
      ports: '443',
      protocols: 'HTTP, WebSockets',
      physicalVsVirtual: 'A web-based interface sitting on top of the SQL database.',
      description: 'The broadcast layer. Converts complex SQL aggregations into interactive charts that drive business value.'
    }
  };

  // Cloud network node definitions
  const cloudNodes: Record<string, NodeDetail> = {
    client: {
      id: 'client',
      name: 'User Client (Browser)',
      role: 'Initiates HTTP requests, renders HTML/JS, handles cookies and local storage.',
      ports: '443 (HTTPS), 80 (HTTP) Outbound',
      protocols: 'TCP, IP, DNS, HTTP/2, HTTP/3',
      physicalVsVirtual: 'Runs on physical client hardware (phone, laptop).',
      description: 'The starting point of all web interactions. It requests files from servers and processes JavaScript to display user interfaces.'
    },
    router: {
      id: 'router',
      name: 'Firewall & Edge Router',
      role: 'Routes packets across the Internet, inspects traffic, blocks unauthorized access.',
      ports: 'Filters all ports, only allows HTTPS/HTTP inbound.',
      protocols: 'BGP, OSPF, IP, IPSec, NAT',
      physicalVsVirtual: 'Can be physical enterprise hardware or software-defined virtual routers (VPC Gateways).',
      description: 'The gatekeeper of the network. It translates local IP addresses to public IPs (NAT) and secures the cloud boundaries against intruders.'
    },
    loadbalancer: {
      id: 'loadbalancer',
      name: 'Load Balancer',
      role: 'Distributes incoming HTTP traffic evenly across multiple healthy backend web servers.',
      ports: '80, 443 Inbound; routes to backend target groups.',
      protocols: 'HTTP, HTTPS, TCP, SSL/TLS Offloading',
      physicalVsVirtual: 'Software-defined virtual appliance running in the cloud provider\'s managed networking tier.',
      description: 'Prevents server overload. If one web server crashes, the load balancer detects it (health checks) and transparently reroutes traffic to healthy servers.'
    },
    server: {
      id: 'server',
      name: 'App Server (Virtual Machine / Container)',
      role: 'Runs your backend code (e.g. Node.js, Python), executes business logic, communicates with DB.',
      ports: '3000, 5000, 8000, 8080 (Internal only)',
      protocols: 'TCP, HTTP, gRPC',
      physicalVsVirtual: 'Typically a Virtual Machine (AWS EC2) or a Docker container running inside a hypervisor.',
      description: 'The brains of the architecture. In modern systems, this is a virtualized, isolated layer that can scale horizontally (adding more instances) on demand.'
    },
    database: {
      id: 'database',
      name: 'Database (SQL/NoSQL)',
      role: 'Provides persistent storage for users, transactions, and site state.',
      ports: '5432 (PostgreSQL), 3306 (MySQL), 27017 (MongoDB)',
      protocols: 'TCP, Proprietary DB Protocols',
      physicalVsVirtual: 'Runs on dedicated storage-optimized virtual machines or managed serverless DB clusters.',
      description: 'The memory bank. Backends ask the database for state, fetch rows, or insert new records. Typically sealed inside a private subnet for security.'
    }
  };

const handleSendDataPacket = () => {
    if (packetState !== 'idle') return;
    setPacketState('traveling');
    setPacketPosition({ x: 70, y: 150 });
    setPacketLog(['[Data Source] Extracting raw CSV file (1.2GB)...']);
    
    setTimeout(() => {
      setPacketPosition({ x: 260, y: 150 });
      setPacketLog(prev => [...prev, '[Python] Loading into Pandas DataFrame.', '[Python] Dropping NaN values and normalizing text.']);
      
      setTimeout(() => {
        setPacketPosition({ x: 450, y: 150 });
        setPacketState('processing');
        setPacketLog(prev => [...prev, '[SQL] Inserting clean data into Relational Tables.', '[SQL] Building B-Tree Indexes for fast querying.']);
        
        setTimeout(() => {
          setPacketPosition({ x: 640, y: 150 });
          setPacketLog(prev => [...prev, '[Tableau] Executing dynamic SELECT and GROUP BY query.', '[Tableau] Rendering Executive Dashboard View.']);
          setPacketState('done');
          
          setTimeout(() => { setPacketState('idle'); }, 3000);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const handleSendPacket = () => {
    if (packetState !== 'idle') return;
    
    setPacketState('traveling');
    setPacketLog(['[Client] Initiated TCP Handshake...', '[Client] Sending HTTPS GET /index.html']);
    
    // Animate to Router
    setTimeout(() => {
      setPacketPosition({ x: 210, y: 150 });
      setPacketLog(prev => [...prev, '[Firewall] Inspecting packet. Port 443 allowed.', '[Router] Routing packet to Load Balancer.']);
      
      // Animate to Load Balancer
      setTimeout(() => {
        setPacketPosition({ x: 350, y: 150 });
        setPacketLog(prev => [...prev, '[Load Balancer] Received request.', '[Load Balancer] Performing health checks on Web Servers...', '[Load Balancer] Forwarding request to Server 1.']);
        
        // Animate to Server
        setTimeout(() => {
          setPacketPosition({ x: 490, y: 100 });
          setPacketState('processing');
          setPacketLog(prev => [...prev, '[Web Server 1] Triggering app controller.', '[Web Server 1] Executing SQL Query: SELECT * FROM courses;']);
          
          // Animate to DB
          setTimeout(() => {
            setPacketPosition({ x: 630, y: 150 });
            setPacketLog(prev => [...prev, '[Database] Query matched index.', '[Database] Returning user record data (20ms).']);
            
            // Return to Server
            setTimeout(() => {
              setPacketPosition({ x: 490, y: 100 });
              setPacketLog(prev => [...prev, '[Web Server 1] Formatted data to JSON.', '[Web Server 1] Generating HTTP Response 200 OK.']);
              
              // Return to Load Balancer
              setTimeout(() => {
                setPacketPosition({ x: 350, y: 150 });
                
                // Return to Client
                setTimeout(() => {
                  setPacketPosition({ x: 70, y: 150 });
                  setPacketState('done');
                  setPacketLog(prev => [...prev, '[Client] Received HTTP Response 200 OK.', '[Client] Rendered webpage successfully in 142ms.']);
                  
                  setTimeout(() => {
                    setPacketState('idle');
                  }, 3000);
                }, 800);
              }, 600);
            }, 800);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // Python CPU-RAM simulation runner
  const startPythonSimulation = async () => {
    if (isPythonRunning) return;
    setIsPythonRunning(true);
    setPythonStep(1);
    setPythonLog(['[Code] x = RAM[0]  (Load variable x into Register A)']);
    
    // Step 1: Load RAM[0] (15) into Register A
    setTimeout(() => {
      setRegA(ram[0]);
      setPythonStep(2);
      setPythonLog(prev => [...prev, `[CPU] Loaded value ${ram[0]} from address 0x00 into Register A.`]);

      // Step 2: Load RAM[1] (27) into Register B
      setTimeout(() => {
        setRegB(ram[1]);
        setPythonStep(3);
        setPythonLog(prev => [...prev, `[CPU] Loaded value ${ram[1]} from address 0x01 into Register B.`]);

        // Step 3: Add Register A + Register B in ALU
        setTimeout(() => {
          const sum = ram[0] + ram[1];
          setAluResult(sum);
          setPythonStep(4);
          setPythonLog(prev => [...prev, `[ALU] Addition complete: ${ram[0]} + ${ram[1]} = ${sum}.`]);

          // Step 4: Write ALU Result back to RAM[2]
          setTimeout(() => {
            setRam(prev => {
              const copy = [...prev];
              copy[2] = sum;
              return copy;
            });
            setPythonStep(5);
            setPythonLog(prev => [...prev, `[RAM] Wrote sum ${sum} into memory address 0x02.`, '[Code] Execution finished successfully.']);
            setIsPythonRunning(false);
          }, 1500);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const resetPythonSimulation = () => {
    setRam([15, 27, 0, 0, 0, 0, 0, 0]);
    setRegA(0);
    setRegB(0);
    setAluResult(0);
    setPythonStep(0);
    setIsPythonRunning(false);
    setPythonLog([]);
  };

  return (
    <div className="blueprint-container raised">
      <div className="blueprint-header">
        <h4 className="blueprint-title">
          <svg className="blueprint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
          {courseId === 'cloud' ? 'Interactive Cloud Infrastructure Blueprint' : isDataAnalyst ? 'Interactive Data Engineering Pipeline' : 'Interactive CPU & Memory Execution Simulator'}
        </h4>
        {courseId === 'cloud' ? (


          <button 
            className="blueprint-btn" 
            disabled={packetState !== 'idle'} 
            onClick={handleSendPacket}
          >
            {packetState === 'idle' ? '⚡ Send HTTP Request' : '📡 Traversing Stack...'}
          </button>
        ) : isDataAnalyst ? (
          <button 
            className="blueprint-btn" 
            disabled={packetState !== 'idle'} 
            onClick={handleSendDataPacket}
          >
            {packetState === 'idle' ? '⚡ Run Data Pipeline' : '📡 Processing Data...'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              className="blueprint-btn" 
              disabled={isPythonRunning} 
              onClick={startPythonSimulation}
            >
              {isPythonRunning ? '⏳ Executing...' : '▶ Run CPU Add Cycle'}
            </button>
            <button 
              className="blueprint-btn text-btn" 
              onClick={resetPythonSimulation}
              style={{ background: 'transparent', border: '1px solid var(--border)' }}
            >
              Reset
            </button>
          </div>
        )}
      </div>

      <div className="blueprint-body">
        {courseId === 'cloud' ? (


          /* =========================================================================
             CLOUD TOPOLOGY SVG
             ========================================================================= */
          <div className="blueprint-canvas-wrap">
            <svg viewBox="0 0 700 300" className="blueprint-svg">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 2 L 10 5 L 0 8 z" fill="var(--border)" />
                </marker>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="var(--win-shadow)" />
                </filter>
              </defs>

              {/* Connecting Paths */}
              <line x1="70" y1="150" x2="210" y2="150" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
              <line x1="210" y1="150" x2="350" y2="150" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
              
              {/* Web Servers Split Paths */}
              <path d="M 350 150 L 490 100" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
              <path d="M 350 150 L 490 200" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
              
              {/* Database Connections */}
              <path d="M 490 100 L 630 150" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
              <path d="M 490 200 L 630 150" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />

              {/* 1. Client Node */}
              <g 
                className={`node-group ${selectedNode === 'client' ? 'selected' : ''}`}
                onClick={() => setSelectedNode('client')}
                transform="translate(70, 150)"
                cursor="pointer"
              >
                <rect x="-40" y="-35" width="80" height="70" rx="4" fill="var(--win-light)" stroke="var(--border)" strokeWidth="2" filter="url(#shadow)" />
                {/* Visual Monitor Sketch */}
                <rect x="-25" y="-20" width="50" height="30" rx="2" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <line x1="-10" y1="15" x2="10" y2="15" stroke="var(--border)" strokeWidth="2" />
                <line x1="-5" y1="10" x2="-10" y2="15" stroke="var(--border)" strokeWidth="1.5" />
                <line x1="5" y1="10" x2="10" y2="15" stroke="var(--border)" strokeWidth="1.5" />
                <text x="0" y="27" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--page-text)">Client</text>
              </g>

              {/* 2. Firewall / Router Node */}
              <g 
                className={`node-group ${selectedNode === 'router' ? 'selected' : ''}`}
                onClick={() => setSelectedNode('router')}
                transform="translate(210, 150)"
                cursor="pointer"
              >
                <rect x="-40" y="-35" width="80" height="70" rx="4" fill="var(--win-light)" stroke="var(--border)" strokeWidth="2" filter="url(#shadow)" />
                {/* Brick wall sketch */}
                <line x1="-25" y1="-15" x2="25" y2="-15" stroke="var(--border)" strokeWidth="1.5" />
                <line x1="-25" y1="0" x2="25" y2="0" stroke="var(--border)" strokeWidth="1.5" />
                <line x1="-25" y1="12" x2="25" y2="12" stroke="var(--border)" strokeWidth="1.5" />
                <line x1="-15" y1="-15" x2="-15" y2="0" stroke="var(--border)" strokeWidth="1.5" />
                <line x1="10" y1="-15" x2="10" y2="0" stroke="var(--border)" strokeWidth="1.5" />
                <line x1="-5" y1="0" x2="-5" y2="12" stroke="var(--border)" strokeWidth="1.5" />
                <line x1="18" y1="0" x2="18" y2="12" stroke="var(--border)" strokeWidth="1.5" />
                <text x="0" y="27" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--page-text)">Firewall</text>
              </g>

              {/* 3. Load Balancer Node */}
              <g 
                className={`node-group ${selectedNode === 'loadbalancer' ? 'selected' : ''}`}
                onClick={() => setSelectedNode('loadbalancer')}
                transform="translate(350, 150)"
                cursor="pointer"
              >
                <rect x="-40" y="-35" width="80" height="70" rx="4" fill="var(--win-light)" stroke="var(--border)" strokeWidth="2" filter="url(#shadow)" />
                {/* Balance scales sketch */}
                <line x1="-20" y1="-10" x2="20" y2="-10" stroke="var(--border)" strokeWidth="2" />
                <line x1="0" y1="-10" x2="0" y2="15" stroke="var(--border)" strokeWidth="2" />
                <line x1="-20" y1="-10" x2="-20" y2="5" stroke="var(--border)" strokeWidth="1" />
                <line x1="20" y1="-10" x2="20" y2="5" stroke="var(--border)" strokeWidth="1" />
                <path d="M -25 5 Q -20 15 -15 5 Z" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <path d="M 15 5 Q 20 15 25 5 Z" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <text x="0" y="27" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--page-text)">Load Balancer</text>
              </g>

              {/* 4. App Server Node 1 (Virtual machine) */}
              <g 
                className={`node-group ${selectedNode === 'server' ? 'selected' : ''}`}
                onClick={() => setSelectedNode('server')}
                transform="translate(490, 100)"
                cursor="pointer"
              >
                <rect x="-40" y="-30" width="80" height="60" rx="4" fill="var(--win-light)" stroke="var(--border)" strokeWidth="2" filter="url(#shadow)" />
                {/* Server racks / vm outline */}
                <rect x="-30" y="-20" width="60" height="12" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <circle cx="-20" cy="-14" r="2" fill="var(--border)" />
                <circle cx="-12" cy="-14" r="2" fill="var(--border)" />
                <rect x="-30" y="-2" width="60" height="12" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <circle cx="-20" cy="4" r="2" fill="var(--border)" />
                <circle cx="-12" cy="4" r="2" fill="var(--border)" />
                <text x="0" y="23" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--page-text)">Web Server 1</text>
              </g>

              {/* 5. App Server Node 2 (Virtual machine) */}
              <g 
                className={`node-group ${selectedNode === 'server' ? 'selected' : ''}`}
                onClick={() => setSelectedNode('server')}
                transform="translate(490, 200)"
                cursor="pointer"
              >
                <rect x="-40" y="-30" width="80" height="60" rx="4" fill="var(--win-light)" stroke="var(--border)" strokeWidth="2" filter="url(#shadow)" />
                {/* Server racks / vm outline */}
                <rect x="-30" y="-20" width="60" height="12" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <circle cx="-20" cy="-14" r="2" fill="var(--border)" />
                <circle cx="-12" cy="-14" r="2" fill="var(--border)" />
                <rect x="-30" y="-2" width="60" height="12" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <circle cx="-20" cy="4" r="2" fill="var(--border)" />
                <circle cx="-12" cy="4" r="2" fill="var(--border)" />
                <text x="0" y="23" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--page-text)">Web Server 2</text>
              </g>

              {/* 6. Database Node */}
              <g 
                className={`node-group ${selectedNode === 'database' ? 'selected' : ''}`}
                onClick={() => setSelectedNode('database')}
                transform="translate(630, 150)"
                cursor="pointer"
              >
                <rect x="-40" y="-35" width="80" height="70" rx="4" fill="var(--win-light)" stroke="var(--border)" strokeWidth="2" filter="url(#shadow)" />
                {/* Cylinder / DB sketch */}
                <ellipse cx="0" cy="-15" rx="20" ry="6" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <path d="M -20 -15 L -20 0 A 20 6 0 0 0 20 0 L 20 -15" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <path d="M -20 0 L -20 15 A 20 6 0 0 0 20 15 L 20 0" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <text x="0" y="29" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--page-text)">Database</text>
              </g>

              {/* Traveling Packet Animation */}
              {packetState !== 'idle' && (
                <circle 
                  cx={packetPosition.x} 
                  cy={packetPosition.y} 
                  r="6" 
                  fill="var(--link)" 
                  stroke="var(--win-light)" 
                  strokeWidth="2"
                  style={{ transition: 'all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                />
              )}
            </svg>
          </div>
        ) : isDataAnalyst ? (
          /* =========================================================================
             DATA ANALYTICS PIPELINE SVG
             ========================================================================= */
          <div className="blueprint-canvas-wrap">
            <svg viewBox="0 0 700 300" className="blueprint-svg">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 2 L 10 5 L 0 8 z" fill="var(--border)" />
                </marker>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="var(--win-shadow)" />
                </filter>
              </defs>

              {/* Connecting Paths */}
              <line x1="70" y1="150" x2="260" y2="150" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
              <line x1="260" y1="150" x2="450" y2="150" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
              <line x1="450" y1="150" x2="640" y2="150" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />

              {/* 1. Data Source Node */}
              <g 
                className={`node-group ${selectedNode === 'datasource' ? 'selected' : ''}`}
                onClick={() => setSelectedNode('datasource')}
                transform="translate(70, 150)"
                cursor="pointer"
              >
                <rect x="-40" y="-35" width="80" height="70" rx="4" fill="var(--win-light)" stroke="var(--border)" strokeWidth="2" filter="url(#shadow)" />
                <rect x="-20" y="-20" width="40" height="30" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <line x1="-20" y1="-10" x2="20" y2="-10" stroke="var(--border)" strokeWidth="1.5" />
                <line x1="-20" y1="0" x2="20" y2="0" stroke="var(--border)" strokeWidth="1.5" />
                <text x="0" y="27" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--page-text)">Raw Data</text>
              </g>

              {/* 2. Python / Pandas Node */}
              <g 
                className={`node-group ${selectedNode === 'python' ? 'selected' : ''}`}
                onClick={() => setSelectedNode('python')}
                transform="translate(260, 150)"
                cursor="pointer"
              >
                <rect x="-40" y="-35" width="80" height="70" rx="4" fill="var(--win-light)" stroke="var(--border)" strokeWidth="2" filter="url(#shadow)" />
                <circle cx="0" cy="-5" r="15" fill="none" stroke="var(--border)" strokeWidth="2" />
                <path d="M -5 -5 L 5 0 L -5 5 Z" fill="var(--border)" />
                <text x="0" y="27" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--page-text)">Python (ETL)</text>
              </g>

              {/* 3. SQL Data Warehouse Node */}
              <g 
                className={`node-group ${selectedNode === 'sql' ? 'selected' : ''}`}
                onClick={() => setSelectedNode('sql')}
                transform="translate(450, 150)"
                cursor="pointer"
              >
                <rect x="-40" y="-35" width="80" height="70" rx="4" fill="var(--win-light)" stroke="var(--border)" strokeWidth="2" filter="url(#shadow)" />
                <ellipse cx="0" cy="-15" rx="20" ry="6" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <path d="M -20 -15 L -20 0 A 20 6 0 0 0 20 0 L 20 -15" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <path d="M -20 0 L -20 15 A 20 6 0 0 0 20 15 L 20 0" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <text x="0" y="29" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--page-text)">SQL Warehouse</text>
              </g>

              {/* 4. Tableau BI Node */}
              <g 
                className={`node-group ${selectedNode === 'tableau' ? 'selected' : ''}`}
                onClick={() => setSelectedNode('tableau')}
                transform="translate(640, 150)"
                cursor="pointer"
              >
                <rect x="-40" y="-35" width="80" height="70" rx="4" fill="var(--win-light)" stroke="var(--border)" strokeWidth="2" filter="url(#shadow)" />
                <rect x="-20" y="-5" width="8" height="15" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <rect x="-5" y="-20" width="8" height="30" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <rect x="10" y="-12" width="8" height="22" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <text x="0" y="27" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--page-text)">Tableau (BI)</text>
              </g>

              {/* Traveling Packet Animation */}
              {packetState !== 'idle' && (
                <circle 
                  cx={packetPosition.x} 
                  cy={packetPosition.y} 
                  r="6" 
                  fill="var(--link)" 
                  stroke="var(--win-light)" 
                  strokeWidth="2"
                  style={{ transition: 'all 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                />
              )}
            </svg>
          </div>

) : ( 
          /* =========================================================================
             PYTHON CPU-RAM EXECUTION SIMULATOR
             ========================================================================= */
          <div className="cpu-simulator-wrap">
            <div className="cpu-grid">
              
              {/* CPU Box */}
              <div className="cpu-box raised">
                <div className="panel-label">Central Processing Unit (CPU)</div>
                <div className="cpu-internals">
                  <div className="registers">
                    <div className={`register-cell ${pythonStep === 2 ? 'pulse-highlight' : ''}`}>
                      <span className="cell-title">Register A</span>
                      <span className="cell-val">{regA}</span>
                    </div>
                    <div className={`register-cell ${pythonStep === 3 ? 'pulse-highlight' : ''}`}>
                      <span className="cell-title">Register B</span>
                      <span className="cell-val">{regB}</span>
                    </div>
                  </div>
                  
                  {/* ALU node */}
                  <div className={`alu-box ${pythonStep === 4 ? 'pulse-highlight' : ''}`}>
                    <span className="alu-title">ALU (Arithmetic Logic Unit)</span>
                    <span className="alu-op">{regA} + {regB}</span>
                    <span className="alu-equals">= {aluResult}</span>
                  </div>
                </div>
              </div>

              {/* RAM Box */}
              <div className="ram-box raised">
                <div className="panel-label">RAM (Random Access Memory)</div>
                <div className="ram-grid">
                  {ram.map((val, idx) => (
                    <div 
                      key={idx} 
                      className={`ram-cell ${
                        (pythonStep === 1 && idx === 0) || 
                        (pythonStep === 2 && idx === 1) || 
                        (pythonStep === 5 && idx === 2) ? 'pulse-highlight' : ''
                      }`}
                    >
                      <span className="ram-addr">0x0{idx}</span>
                      <span className="ram-var">
                        {idx === 0 ? 'x' : idx === 1 ? 'y' : idx === 2 ? 'result' : `mem[${idx}]`}
                      </span>
                      <input 
                        type="number" 
                        value={val}
                        disabled={isPythonRunning}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          setRam(prev => {
                            const copy = [...prev];
                            copy[idx] = v;
                            return copy;
                          });
                        }}
                        className="ram-input"
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Blueprint Footer logs/details */}
      <div className="blueprint-footer">
        {courseId === 'cloud' ? (


          <div className="inspection-grid">
            <div className="node-details">
              <div className="detail-row">
                <span className="detail-label">Node:</span>
                <strong className="detail-value">{cloudNodes[selectedNode].name}</strong>
              </div>
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value">{cloudNodes[selectedNode].role}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ports:</span>
                <code className="detail-value">{cloudNodes[selectedNode].ports}</code>
              </div>
              <div className="detail-row">
                <span className="detail-label">Protocols:</span>
                <span className="detail-value">{cloudNodes[selectedNode].protocols}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stack:</span>
                <span className="detail-value">{cloudNodes[selectedNode].physicalVsVirtual}</span>
              </div>
              <p className="detail-summary">{cloudNodes[selectedNode].description}</p>
            </div>
            <div className="packet-logs">
              <span className="logs-header">📡 Live Request Trace Log</span>
              <div className="logs-scroll">
                {packetLog.length === 0 ? (
                  <span className="logs-empty">Click "Send HTTP Request" to see network packet lifecycle.</span>
                ) : (
                  packetLog.map((log, i) => (
                    <div key={i} className="log-line">{log}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="python-simulation-logs">
            <span className="logs-header">💻 ALU Operations & Instruction Fetch Logs</span>
            <div className="logs-scroll">
              {pythonLog.length === 0 ? (
                <span className="logs-empty">Click "Run CPU Add Cycle" to witness variables loading into registers and ALU calculations.</span>
              ) : (
                pythonLog.map((log, i) => (
                  <div key={i} className="log-line">{log}</div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .blueprint-container {
          display: flex;
          flex-direction: column;
          background: var(--win-light);
          border: 2px solid var(--border);
          height: 100%;
          min-height: 480px;
          overflow: hidden;
          font-family: var(--font-content);
        }
        
        .blueprint-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--win-titlebar);
          color: var(--win-titletext);
          border-bottom: 2px solid var(--border);
        }

        .blueprint-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-ui);
          font-size: 0.85rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .blueprint-icon {
          width: 14px;
          height: 14px;
        }

        .blueprint-btn {
          font-family: var(--font-ui);
          font-size: 0.72rem;
          font-weight: bold;
          padding: 4px 8px;
          border: 2px solid var(--border);
          background: var(--win-light);
          color: var(--page-text);
          cursor: pointer;
          transition: all 100ms ease;
        }

        .blueprint-btn:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 2px 2px 0 var(--border);
        }

        .blueprint-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .blueprint-body {
          flex: 1;
          display: flex;
          background: var(--win-midlight);
          padding: 12px;
          overflow: hidden;
          justify-content: center;
          align-items: center;
          border-bottom: 1px solid var(--border);
        }

        .blueprint-canvas-wrap {
          width: 100%;
          max-width: 680px;
          display: flex;
          justify-content: center;
        }

        .blueprint-svg {
          width: 100%;
          height: auto;
          overflow: visible;
        }

        .node-group rect {
          transition: fill 0.2s, stroke-width 0.2s;
        }

        .node-group:hover rect {
          fill: var(--win-mid);
        }

        .node-group.selected rect {
          stroke: var(--link);
          stroke-width: 3px;
        }

        /* CPU simulation styling */
        .cpu-simulator-wrap {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .cpu-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          height: 100%;
        }

        .cpu-box, .ram-box {
          background: var(--win-light);
          border: 2px solid var(--border);
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .panel-label {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--link);
          text-transform: uppercase;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 4px;
          margin-bottom: 8px;
        }

        .cpu-internals {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          justify-content: center;
        }

        .registers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .register-cell {
          border: 1px dashed var(--border);
          padding: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--win-midlight);
          transition: background-color 0.3s;
        }

        .cell-title {
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .cell-val {
          font-size: 1.1rem;
          font-weight: bold;
          font-family: var(--font-mono);
        }

        .alu-box {
          border: 2px solid var(--border);
          padding: 8px;
          background: var(--win-midlight);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s;
        }

        .alu-title {
          font-family: var(--font-ui);
          font-size: 0.68rem;
          font-weight: bold;
          color: var(--text-muted);
        }

        .alu-op {
          font-size: 0.95rem;
          font-family: var(--font-mono);
          font-weight: bold;
          margin-top: 4px;
        }

        .alu-equals {
          font-size: 1.05rem;
          font-family: var(--font-mono);
          font-weight: 800;
          color: var(--link);
        }

        .ram-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          flex: 1;
          align-content: center;
        }

        .ram-cell {
          border: 1px solid var(--border-light);
          padding: 4px 6px;
          background: var(--win-midlight);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 4px;
          align-items: center;
          font-size: 0.72rem;
          transition: background-color 0.3s;
        }

        .ram-addr {
          font-family: var(--font-mono);
          font-weight: bold;
          color: var(--text-dim);
        }

        .ram-var {
          font-weight: bold;
        }

        .ram-input {
          grid-column: 1 / -1;
          width: 100%;
          border: 1px solid var(--border);
          background: var(--win-light);
          font-family: var(--font-mono);
          font-size: 0.8rem;
          font-weight: bold;
          padding: 2px 4px;
          outline: none;
          color: var(--page-text);
        }

        .ram-input:focus {
          border-color: var(--link);
        }

        .pulse-highlight {
          background: rgba(139, 0, 0, 0.1) !important;
          animation: pulse 1s infinite alternate;
          border-color: var(--link) !important;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 2px rgba(139, 0, 0, 0.2); }
          100% { box-shadow: 0 0 8px rgba(139, 0, 0, 0.5); }
        }

        /* Blueprint Footer / Details panel */
        .blueprint-footer {
          background: var(--win-light);
          padding: 10px;
          font-size: 0.78rem;
          max-height: 170px;
          overflow-y: auto;
        }

        .inspection-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 12px;
          height: 100%;
        }

        .node-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .detail-label {
          font-weight: bold;
          color: var(--text-dim);
          min-width: 65px;
          flex-shrink: 0;
          font-size: 0.72rem;
          text-transform: uppercase;
        }

        .detail-value {
          font-size: 0.75rem;
        }

        .detail-summary {
          margin-top: 4px;
          font-style: italic;
          color: var(--text-muted);
          font-size: 0.72rem;
          line-height: 1.3;
        }

        .packet-logs, .python-simulation-logs {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-light);
          background: var(--win-midlight);
          padding: 6px;
          height: 100%;
          min-height: 120px;
        }

        .logs-header {
          font-family: var(--font-ui);
          font-size: 0.68rem;
          font-weight: bold;
          color: var(--link);
          text-transform: uppercase;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 2px;
          margin-bottom: 4px;
        }

        .logs-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .logs-empty {
          color: var(--text-dim);
          font-size: 0.72rem;
          font-style: italic;
        }

        .log-line {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          color: var(--page-text);
          line-height: 1.3;
        }
      `}</style>
    </div>
  );
}
