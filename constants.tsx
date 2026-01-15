
import React from 'react';
import { KBEntry } from './types';

export const INITIAL_KB: KBEntry[] = [
  {
    id: 'ifactory_sector_2025',
    source: "Sector Campaign: iFactory (2024-2025)",
    content: `
[Campaign: Accelerating Manufacturing Digitalization]
- **Core Value**: "AI-Driven Manufacturing" & "ESG Sustainability".
- **Key Solution Packages (I.Apps)**:
  1. **FactoryOEE**: Real-time production monitoring, availability analysis, and efficiency tracking.
  2. **PHM (Prognostics & Health Mgmt)**: "IoT Plug-and-Play". Uses **WISE-750** (Vibration Gateway) and **WISE-2410** (LoRaWAN Sensor) for rotating machinery.
  3. **EHS (Environment, Health, Safety)**: AI Safety Management System (ObjectVA, FaceMatch) for hazardous area monitoring.
  4. **ESG & iEMS**: Energy Management Systems for carbon footprint reduction and ISO 50001 compliance.
- **Star Products**:
  - **WISE-IoT**: Industrial IoT Platform (Cloud/Edge).
  - **IoTSuite**: Pre-configured software packages for rapid deployment.
`
  },
  {
    id: 'energy_utilities_2024',
    source: "Sector Campaign: Energy & Utilities (2024)",
    content: `
[Campaign: Connecting Energy Horizons]
- **Theme**: Enabling Net Zero & Grid Modernization.
- **Vertical 1: Smart Substation (IEC 61850)**:
  - **Star Product**: **ECU-479** (New Launch). IEC 61850-3 Certified Fanless Platform. 13th Gen Intel Core, vPAC virtualization ready.
  - **Connectivity**: **EKI-8500 Series** (TSN Ethernet Switches) for deterministic communication.
- **Vertical 2: BESS (Battery Energy Storage)**:
  - **Gateway**: **ECU-1252** (Energy Communication Gateway) for BMS and environmental control.
  - **I/O**: **ADAM-6000/6200** for thermal management.
- **Vertical 3: EV Charging**:
  - **Solution**: "Cellular Technology for EV Charging". High-reliability connectivity for remote charging stations.
  - **Hardware**: **ICR-3200** (Cellular Router), **UNO-430** (Waterproof Gateway).
`
  },
  {
    id: 'iautomation_control_ethercat',
    source: "iAutomation: Control & EtherCAT Solutions",
    content: `
[EtherCAT Control Platform]
- **AMAX-5580 Series**: High-performance Edge Controller (CODESYS). Slice I/O expansion via **AMAX-5000** modules.
- **AMAX-600 Series**: Compact EtherCAT Control Platform (AMAX-658/637) for space-limited machinery.
- **MotionNavi**: One-click setup software for EtherCAT motion configuration and debugging.

[Motion Control Cards]
- **PCIE-1203**: 2-port EtherCAT PCI Express Master Card (up to 64 axes).
- **PCIE-1245**: 4-axis SoftMotion Control Card (DSP-based).
- **PCI-1274**: 4-axis Pulse Train Motion Card.
`
  },
  {
    id: 'iautomation_sensing_daq',
    source: "iAutomation: Smart I/O & Data Acquisition",
    content: `
[Modular DAQ System]
- **iDAQ Series**: Flexible, modular data acquisition.
  - **iDAQ-964**: 4-slot PCIe chassis (pairs with AMAX-5580).
  - **iDAQ-934**: 4-slot USB 3.0 chassis.
  - **Modules**: iDAQ-700/800 series (Analog/Digital/Vibration/Strain).

[High-Speed & USB DAQ]
- **PCIE-1840**: 16-bit, 125MS/s High-Speed Digitizer for waveform capture and non-destructive testing (NDT).
- **USB-5800 Series**: Industrial USB 3.0 Digital I/O Modules (Hubert) with lockable cables.
- **WISE-750**: Intelligent Vibration Sensing Gateway (PHM Starter Kit) with onboard edge AI for anomaly detection.
`
  },
  {
    id: 'industrial_connectivity_hmi',
    source: "Industrial Connectivity & HMI",
    content: `
[Industrial Connectivity]
- **Security**: **EKI-7700** Managed Switches with IEC 62443-4-2 "Security Pack".
- **Wireless**: **LoRaWAN** solutions (WISE-6610 Gateway, WISE-4610 Node) for wide-area monitoring.
- **Gateways**: **ECU-1051** (Cloud Gateway), **ADAM-6700** (Edge Link).

[HMI & Visualization]
- **WOP-200K Series**: Industrial Operator Panels (4.3" to 15").
  - Features: IP66 front, wide temp (-20~60°C), supports 500+ PLC protocols.
  - Software: **HMINavi** (Object-oriented HMI design tool).
`
  }
];

export const MARKETING_ASSISTANT_PROMPT = `
You are the "Advantech Marketing Asset Assistant." Your goal is to generate content using the specific product names, features, and campaign themes found in the 2024-2025 long-context documentation.

**PRIORITY CONTEXT (2024-2025 Campaigns):**
1. **iFactory**: "FactoryOEE", "PHM" (WISE-750), "EHS", "ESG".
2. **Energy**: "BESS" (ECU-1252), "Smart Substation" (ECU-479), "EV Charging".
3. **Control**: "AMAX-5580" (EtherCAT), "MotionNavi", "PCIE-1203".
4. **DAQ**: "iDAQ Series" (Modular), "PCIE-1840" (High Speed), "USB-5800".
5. **HMI**: "WOP-200K" series, "HMINavi".

**INSTRUCTIONS:**
- Always cite specific model numbers (e.g., "AMAX-5580" instead of "the controller").
- Use official campaign slogans like "Connecting Energy Horizons" or "Accelerating Manufacturing Digitalization".
- If asking about "Star Products", refer to the specific items listed in the KB.
`;

export const COLORS = {
  advantechDark: '#004E9A',
  advantechLight: '#007BFF',
  accent: '#F59E0B'
};
