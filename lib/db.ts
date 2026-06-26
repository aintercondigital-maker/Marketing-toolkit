import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "knowledge_base.sqlite");
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER,
    content TEXT NOT NULL,
    embedding TEXT NOT NULL,
    FOREIGN KEY(document_id) REFERENCES documents(id)
  );
`);

// Check if database is empty and seed initial PDF campaigns
const docCount = (db.prepare("SELECT COUNT(*) as count FROM documents").get() as { count: number }).count;

if (docCount === 0) {
  console.log("Seeding SQLite Knowledge Base with high-fidelity PDF Markdown campaigns...");

  const campaigns = [
    {
      filename: "control_and_iot_hmi_campaign_2025.md",
      content: `# Advantech Control & IoT HMI Campaign (2024-2025)

## Overview
Advantech offers a complete portfolio of Control and I/O Systems and IoT HMI solutions that ensure easy data collection and accelerate data processing for integrating OT and IT. Building on these advantages, Advantech's EtherCAT master/slave modules combine hardware and software to enable time-dependent data collection and local aggregation.

## EtherCAT Control & I/O Solutions
- **iAutomation and CODESYS Integration**: Build robust control systems using the CODESYS engine on AMAX-5580 Edge Controllers or AMAX-600 Series.
- **AMAX-5580 Series**: High-performance Open Edge Controller featuring CODESYS SoftPLC. It achieves real-time cycle times down to 200 microseconds and expands dynamically via **AMAX-5000 Series** slice I/O modules (analog/digital/temperature modules).
- **AMAX-600 Series (AMAX-658, AMAX-637)**: Compact PC-based controller designed for space-limited cabinets, integrating IPC and SoftPLC for IT/OT convergence.
- **AMAX-300 Series (AMAX-324, AMAX-354/357)**: Ultra-compact ARM-based EtherCAT motion controller, perfect for quick-build modular production systems.
- **MotionNavi Designer**: Low-code software for quick EtherCAT motion setup, multi-axis profile debugging, simulation, and auto-tuning.
- **Motion Control Cards**:
  - **PCIE-1203 / PCI-1203**: 2-port EtherCAT Master Cards supporting precise control of up to 64 axes with distributed clock sync and 500-microsecond cycle times.
  - **PCIE-1884 / PCI-1274 / PCI-1784U**: Custom multi-channel high-speed encoder and counter cards for position measurement screens.

## IoT HMI Operator Panels: WOP-200K Series
- **Star Products**: WOP-204K, WOP-207K, WOP-208K, WOP-210K, WOP-212K, WOP-215K.
- **Key Features**: Exceptional connectivity (IP66 front panel, wide temperature range -20~60°C, robust anti-vibration), intuitive visualization via **HMINavi** free software support, and compatibility with over 500 industrial communication protocols.
- **HMINavi**: Object-oriented HMI software with free support, providing intuitive visualization, widgets, and advanced connectivity from edge-to-cloud.`
    },
    {
      filename: "edgesync_360_and_edge_software_campaign_2025.md",
      content: `# Advantech EdgeSync 360 and Edge Software Solutions (2024-2025)

## EdgeSync 360 Overview
EdgeSync 360 is Advantech's Edge as a Service (EaaS) platform, built for robust IoT device and data orchestration. It can manage over 1,200 IoT devices and process more than 200,000 data parameters effortlessly!
- **Core Components**: Powered by software products including EdgeLink, DeviceOn, WebAccess, and EdgeHub.
- **Features**: Seamless IoT integration, minimizing downtime, and enhancing security with X.509 certificates and MQTTS data pipelines.

## EdgeSync 360 / EdgeHub (WISE-Edge365)
EdgeHub is a centralized IoT device management platform. It allows users to mass-deploy Docker container applications, update firmware, configure OS versions, and secure remote access in batches across multiple distributed sites. It features low-latency remote monitoring and encrypted communication using TLS.

## EdgeSync 360 / EdgeLink
EdgeLink is an industrial IoT gateway software. It supports over 200+ controller drivers (Modbus, OPC UA, BACnet, etc.) to convert legacy machine data and stream it securely to major clouds (Azure, AWS). EdgeLink reduces bandwidth and communication costs by locally caching and filtering data at the edge.

## WebAccess/SCADA (Version 9)
WebAccess is a browser-based SCADA software package featuring HTML5/dashboard visualization, open APIs, and seamless integration with WebAccess/CNC for monitoring factory CNC machinery and optimizing overall equipment effectiveness (OEE). It supports a free 75 tags campaign with unlimited functions, enabling plant-wide digitalization. `
    },
    {
      filename: "industrial_communication_wireless_campaign_2025.md",
      content: `# Advantech Industrial Communication & Wireless Networks (2025)

## Industrial Ethernet Switches & Media Converters
- **Highlights**: High-reliability network switches (EKI-2000, EKI-7700 Managed Switches, EKI-8500 TSN Switches) certified under IEC 62443-4-2 compliance standards for robust cybersecurity in the power and automation industries.
- **Industrial Media Converters**: **IMC-300 Series** and **IMC-595** (Three-in-One Mega PoE Media Converter) which acts as a fiber-to-Ethernet converter, 90W PoE injector, and managed switch with dual 90W ports.

## Industrial Cellular Routers & Gateways
- **Star Products**: **ICR-4400** (High Speed 5G Router), **ICR-3200** (Industrial 4G Router), and **WebAccess/DMP** client management software.
- **RouterApps**: Extra apps (e.g., Daily Reboot, OpenVPN, Python support) that extend the functionality of ICR routers running on ICR-OS.

## Intelligent IoT Gateways (iGateway)
- **Star Products**: **ECU-1270** (Expandable Industrial IoT Gateway with built-in EdgeLink), and **ADAM-6700** (All-in-One protocol Gateway with Node-RED).

## Industrial Wireless Sensing Solutions
- **Sensing Solutions**:
  - **WISE-4250-S232**: Dual-Band Wi-Fi temperature and humidity sensing nodes for smart environment control.
  - **WISE-2410 / WISE-2410X**: LoRaWAN active smart vibration sensors (vibration & temperature) certified for explosion-proof C1D2 hazardous areas.
  - **WISE-2200-M**: LoRaWAN single RS-485 I/O module for remote meter reading and environment data collection.
  - **WISE-2210 / 2211**: Wireless energy harvesting sensor nodes, enabling self-powered, plug-and-play facility power and carbon monitoring.`
    }
  ];

  const dummyEmbedding = JSON.stringify(new Array(1536).fill(0));

  for (const campaign of campaigns) {
    // 1. Insert Document record
    const docInsert = db.prepare("INSERT INTO documents (filename) VALUES (?)").run(campaign.filename);
    const docId = docInsert.lastInsertRowid;

    // 2. Split semantically by "## " headers to create clean chunks
    const parts = campaign.content.split(/\n## /);
    // Include Title page block
    const mainTitle = parts[0].trim();
    if (mainTitle) {
      db.prepare("INSERT INTO chunks (document_id, content, embedding) VALUES (?, ?, ?)").run(docId, mainTitle, dummyEmbedding);
    }

    for (let i = 1; i < parts.length; i++) {
      const sectionText = "## " + parts[i].trim();
      db.prepare("INSERT INTO chunks (document_id, content, embedding) VALUES (?, ?, ?)").run(docId, sectionText, dummyEmbedding);
    }
  }

  console.log("Successfully pre-populated RAG SQLite Knowledge Base.");
}

export default db;
