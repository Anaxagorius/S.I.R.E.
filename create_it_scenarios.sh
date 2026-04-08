#!/bin/bash
BACKEND="/home/runner/work/S.I.R.E./S.I.R.E./SIRE_backend/backend/src/scenarios"
FRONTEND="/home/runner/work/S.I.R.E./S.I.R.E./SIRE_frontend/src/data/scenarios"

write_scenario() {
  local filename="$1"
  local content="$2"
  echo "$content" > "$BACKEND/$filename"
  echo "$content" > "$FRONTEND/$filename"
}

# 1. scenario_server_failure.json
write_scenario "scenario_server_failure.json" '{
  "title": "server_failure",
  "description": "A production server fails unexpectedly, taking down hosted services.",
  "timeline": [
    { "index": 0, "title": "Monitoring Alert Triggered", "description": "Monitoring systems detect the production server has stopped responding to health checks.", "timeOffsetSec": 5 },
    { "index": 1, "title": "Services Go Offline", "description": "Web applications and APIs hosted on the server become unreachable. Users begin reporting outages.", "timeOffsetSec": 20 },
    { "index": 2, "title": "On-Call Engineer Paged", "description": "The on-call engineer receives a PagerDuty alert and begins initial triage.", "timeOffsetSec": 60 },
    { "index": 3, "title": "Root Cause Identified", "description": "Investigation reveals a hardware fault caused a kernel panic and server halt.", "timeOffsetSec": 120 },
    { "index": 4, "title": "Failover Initiated", "description": "Traffic is redirected to standby servers while the failed host is examined.", "timeOffsetSec": 180 },
    { "index": 5, "title": "Services Restored", "description": "All services are restored on standby infrastructure. Post-incident review is scheduled.", "timeOffsetSec": 300 }
  ],
  "root": "node-1",
  "nodes": {
    "node-1": {
      "title": "Production Server Unresponsive",
      "situation": "You receive a critical alert: a production server is not responding to health checks and all hosted services are down. Users are actively impacted. You have remote access to the management console.",
      "question": "What is your immediate action?",
      "options": [
        { "label": "A", "text": "Acknowledge the alert, notify stakeholders of the outage, and begin triage by checking the server console for error messages.", "outcome": { "type": "node", "target": "node-2" } },
        { "label": "B", "text": "Immediately reboot the server without investigating the cause to restore services as fast as possible.", "outcome": { "type": "failure" } },
        { "label": "C", "text": "Wait 15 minutes to see if the server recovers on its own before taking action.", "outcome": { "type": "failure" } }
      ]
    },
    "node-2": {
      "title": "Console Diagnostics",
      "situation": "The server console shows a kernel panic message caused by a hardware fault on the primary NIC. Monitoring confirms no network packets have been received for 12 minutes. A warm standby server is available.",
      "question": "How do you proceed?",
      "options": [
        { "label": "A", "text": "Initiate failover by redirecting DNS and load-balancer traffic to the standby server while preserving the failed server for forensic analysis.", "outcome": { "type": "node", "target": "node-3" } },
        { "label": "B", "text": "Attempt to hot-swap the NIC in the running server without powering it down.", "outcome": { "type": "failure" } }
      ]
    },
    "node-3": {
      "title": "Failover Execution",
      "situation": "Traffic has been redirected to the standby server and services are recovering. You must now validate service health and ensure the standby can sustain production load.",
      "question": "What do you do?",
      "options": [
        { "label": "A", "text": "Run automated smoke tests against the standby, monitor CPU and memory metrics, and confirm all dependent services are operational.", "outcome": { "type": "node", "target": "node-4" } },
        { "label": "B", "text": "Declare the incident resolved immediately after traffic redirection without verifying service health.", "outcome": { "type": "failure" } }
      ]
    },
    "node-4": {
      "title": "Post-Failover Stabilization",
      "situation": "The standby server is handling production traffic. The failed server has been isolated. Management asks for an estimated time to full resolution.",
      "question": "What is your next step?",
      "options": [
        { "label": "A", "text": "Document the incident timeline, coordinate hardware replacement for the failed server, and schedule a post-incident review within 48 hours.", "outcome": { "type": "node", "target": "node-5" } },
        { "label": "B", "text": "Bring the failed server back online immediately without replacing the faulty hardware to reduce costs.", "outcome": { "type": "failure" } }
      ]
    },
    "node-5": {
      "title": "Scenario Complete",
      "situation": "You successfully identified the hardware fault, executed a clean failover to the standby server, validated service health, and initiated the post-incident review process. Production services are fully restored.",
      "question": "Scenario complete. Well done!",
      "options": []
    }
  },
  "category": "IT Operations",
  "difficulty": "Beginner",
  "tags": ["server", "hardware", "failover", "incident-response"]
}'

# 2. scenario_disk_corruption.json
write_scenario "scenario_disk_corruption.json" '{
  "title": "disk_corruption",
  "description": "A production server disk experiences file system corruption, causing data access failures.",
  "timeline": [
    { "index": 0, "title": "I/O Errors Detected", "description": "Application logs begin showing I/O errors and file access failures on the primary data volume.", "timeOffsetSec": 5 },
    { "index": 1, "title": "Database Queries Failing", "description": "The database reports corrupted table entries and starts rejecting read/write operations.", "timeOffsetSec": 20 },
    { "index": 2, "title": "Alert Escalated", "description": "Monitoring escalates the alert to the on-call DBA and infrastructure team.", "timeOffsetSec": 60 },
    { "index": 3, "title": "Disk Health Check", "description": "SMART diagnostics reveal reallocated sectors and a failing disk spindle.", "timeOffsetSec": 120 },
    { "index": 4, "title": "Backup Restoration Initiated", "description": "Team begins restoring the last verified backup to a clean replacement disk.", "timeOffsetSec": 180 },
    { "index": 5, "title": "Service Restored", "description": "Data volume restored from backup. File system integrity verified and services restarted.", "timeOffsetSec": 300 }
  ],
  "root": "node-1",
  "nodes": {
    "node-1": {
      "title": "File System I/O Errors",
      "situation": "Application logs show repeated I/O errors on /dev/sdb1, the primary data volume. The database is rejecting writes and users cannot save data. The disk is mounted read-write and the server is still running.",
      "question": "What is your immediate action?",
      "options": [
        { "label": "A", "text": "Immediately run SMART diagnostics on the disk, place the application in maintenance mode to prevent further writes, and notify stakeholders.", "outcome": { "type": "node", "target": "node-2" } },
        { "label": "B", "text": "Run fsck on the mounted live filesystem to repair corruption without unmounting.", "outcome": { "type": "failure" } },
        { "label": "C", "text": "Ignore the errors and wait for the application to self-heal, as transient I/O errors are common.", "outcome": { "type": "failure" } }
      ]
    },
    "node-2": {
      "title": "SMART Diagnostics Results",
      "situation": "SMART diagnostics confirm the disk has 47 reallocated sectors and pending uncorrectable errors. The disk is physically failing. A replacement disk and last night's verified backup are available.",
      "question": "How do you proceed?",
      "options": [
        { "label": "A", "text": "Unmount the corrupted volume, replace the disk, and begin restoring data from the last verified backup to the new disk.", "outcome": { "type": "node", "target": "node-3" } },
        { "label": "B", "text": "Attempt to clone the failing disk to the replacement while it is still active, risking further corruption.", "outcome": { "type": "failure" } }
      ]
    },
    "node-3": {
      "title": "Backup Restoration",
      "situation": "The new disk is installed and the backup restoration has completed. Before bringing services back online, you need to verify data integrity.",
      "question": "What do you do?",
      "options": [
        { "label": "A", "text": "Run fsck on the new volume, verify checksum integrity of restored files, and perform a database consistency check before restarting services.", "outcome": { "type": "node", "target": "node-4" } },
        { "label": "B", "text": "Restart services immediately after restoration without verifying integrity to minimize downtime.", "outcome": { "type": "failure" } }
      ]
    },
    "node-4": {
      "title": "Service Restart and Validation",
      "situation": "Integrity checks passed. Services have been restarted and initial tests show data is accessible. You need to confirm the incident is fully resolved and prevent recurrence.",
      "question": "What is your next step?",
      "options": [
        { "label": "A", "text": "Monitor disk health metrics, update the incident ticket with root cause and timeline, and review disk replacement and backup testing procedures.", "outcome": { "type": "node", "target": "node-5" } },
        { "label": "B", "text": "Close the incident ticket without documenting the root cause to save time.", "outcome": { "type": "failure" } }
      ]
    },
    "node-5": {
      "title": "Scenario Complete",
      "situation": "You correctly identified the failing disk using SMART diagnostics, safely restored data from backup, verified file system integrity, and documented the incident with preventive recommendations.",
      "question": "Scenario complete. Well done!",
      "options": []
    }
  },
  "category": "IT Operations",
  "difficulty": "Beginner",
  "tags": ["disk", "corruption", "storage", "backup-restore"]
}'

# 3. scenario_raid_failure.json
write_scenario "scenario_raid_failure.json" '{
  "title": "raid_failure",
  "description": "Multiple disks in a RAID array fail, threatening data loss and service continuity.",
  "timeline": [
    { "index": 0, "title": "First Disk Fails", "description": "RAID controller reports the first disk failure. Array enters degraded mode but continues operating.", "timeOffsetSec": 5 },
    { "index": 1, "title": "Second Disk Failure Alert", "description": "A second disk in the RAID-5 array fails. The array is now offline and data is inaccessible.", "timeOffsetSec": 20 },
    { "index": 2, "title": "Critical Alert Triggered", "description": "Storage monitoring fires a P1 alert. All applications dependent on the array go offline.", "timeOffsetSec": 60 },
    { "index": 3, "title": "RAID Controller Analysis", "description": "Engineers examine the RAID controller logs to assess which disks failed and in what order.", "timeOffsetSec": 120 },
    { "index": 4, "title": "Disk Replacement and Rebuild", "description": "Replacement disks are sourced and installed. RAID rebuild begins from surviving parity data.", "timeOffsetSec": 180 },
    { "index": 5, "title": "Array Rebuilt and Services Restored", "description": "RAID array rebuild completes. File system integrity verified and services restored.", "timeOffsetSec": 300 }
  ],
  "root": "node-1",
  "nodes": {
    "node-1": {
      "title": "RAID Array Offline",
      "situation": "You receive a critical alert: two disks in a RAID-5 array have failed in quick succession and the array is offline. All data is inaccessible. You have access to the RAID controller management interface and know the last verified backup is 18 hours old.",
      "question": "What is your immediate action?",
      "options": [
        { "label": "A", "text": "Declare a P1 incident, notify stakeholders, review RAID controller logs to confirm the failure sequence, and assess whether partial data recovery is possible before restoring from backup.", "outcome": { "type": "node", "target": "node-2" } },
        { "label": "B", "text": "Immediately initialize a new RAID array on replacement disks and restore from backup without reviewing controller logs.", "outcome": { "type": "failure" } },
        { "label": "C", "text": "Force the RAID array online in degraded mode with two failed disks to restore access quickly.", "outcome": { "type": "failure" } }
      ]
    },
    "node-2": {
      "title": "Controller Log Analysis",
      "situation": "Controller logs show disk 0 failed first due to bad sectors, and disk 2 failed 8 minutes later likely due to stress during degraded rebuild. One disk (disk 1) with parity data is intact. A RAID specialist suggests partial reconstruction may recover the last 18 hours of data.",
      "question": "How do you proceed?",
      "options": [
        { "label": "A", "text": "Attempt RAID reconstruction using the surviving parity disk in a read-only mode to recover the most recent data before falling back to backup if reconstruction fails.", "outcome": { "type": "node", "target": "node-3" } },
        { "label": "B", "text": "Skip the reconstruction attempt and go directly to the 18-hour-old backup to save time.", "outcome": { "type": "failure" } }
      ]
    },
    "node-3": {
      "title": "Reconstruction and Replacement",
      "situation": "Partial reconstruction recovered 14 hours of additional data beyond the backup. New replacement disks have arrived. You must now rebuild the RAID array correctly.",
      "question": "What do you do?",
      "options": [
        { "label": "A", "text": "Install replacement disks, initialize a new RAID-6 array (upgrading from RAID-5 for better fault tolerance), restore from backup plus recovered data, and monitor the rebuild progress.", "outcome": { "type": "node", "target": "node-4" } },
        { "label": "B", "text": "Rebuild the same RAID-5 configuration without reviewing whether the array design contributed to the failure.", "outcome": { "type": "failure" } }
      ]
    },
    "node-4": {
      "title": "Array Rebuild Monitoring",
      "situation": "The RAID-6 array rebuild is in progress (estimated 4 hours). Services are partially restored using backup data. Management is asking for a full recovery ETA and a root cause report.",
      "question": "What is your next step?",
      "options": [
        { "label": "A", "text": "Provide management with a recovery ETA, document the root cause (sequential disk failures under degraded rebuild stress), and propose enhanced disk health monitoring and regular RAID health checks.", "outcome": { "type": "node", "target": "node-5" } },
        { "label": "B", "text": "Tell management the incident is resolved once the rebuild starts, and defer documentation indefinitely.", "outcome": { "type": "failure" } }
      ]
    },
    "node-5": {
      "title": "Scenario Complete",
      "situation": "You expertly handled a complex RAID-5 dual-disk failure by analyzing controller logs, attempting data reconstruction, upgrading to a more resilient RAID-6 configuration, and providing transparent communication to management.",
      "question": "Scenario complete. Well done!",
      "options": []
    }
  },
  "category": "IT Operations",
  "difficulty": "Advanced",
  "tags": ["RAID", "storage", "disk-failure", "data-recovery"]
}'

# 4. scenario_network_switch_failure.json
write_scenario "scenario_network_switch_failure.json" '{
  "title": "network_switch_failure",
  "description": "A core network switch fails, causing widespread connectivity loss across a datacenter floor.",
  "timeline": [
    { "index": 0, "title": "Connectivity Loss Reported", "description": "Multiple servers on the same network segment simultaneously lose connectivity. Monitoring shows mass-ping failures.", "timeOffsetSec": 5 },
    { "index": 1, "title": "Switch Unresponsive", "description": "The core switch management interface is unreachable. Physical inspection shows no link lights on uplink ports.", "timeOffsetSec": 20 },
    { "index": 2, "title": "Incident Declared", "description": "Network team declares a P1 incident and begins isolating the failed switch from the topology.", "timeOffsetSec": 60 },
    { "index": 3, "title": "Spare Switch Located", "description": "A spare switch with identical configuration backup is located in the storage room.", "timeOffsetSec": 120 },
    { "index": 4, "title": "Replacement Switch Installed", "description": "The spare switch is racked, powered on, and configuration is restored from backup.", "timeOffsetSec": 180 },
    { "index": 5, "title": "Connectivity Restored", "description": "All servers regain network connectivity. Services resume normal operation.", "timeOffsetSec": 300 }
  ],
  "root": "node-1",
  "nodes": {
    "node-1": {
      "title": "Mass Connectivity Loss",
      "situation": "Monitoring alerts show 47 servers on Floor 2 have simultaneously lost network connectivity. The core switch for that segment is unresponsive. You are on-site and have physical access to the network closet.",
      "question": "What is your immediate action?",
      "options": [
        { "label": "A", "text": "Physically inspect the switch for power and link-light status, attempt a console connection to diagnose the fault, and declare a P1 incident while notifying the network team.", "outcome": { "type": "node", "target": "node-2" } },
        { "label": "B", "text": "Power-cycle the switch immediately without assessing whether doing so could cause additional issues.", "outcome": { "type": "failure" } },
        { "label": "C", "text": "Begin reconfiguring all 47 servers with new static routes to bypass the switch before diagnosing the fault.", "outcome": { "type": "failure" } }
      ]
    },
    "node-2": {
      "title": "Switch Hardware Fault Confirmed",
      "situation": "Console connection shows the switch powered on but the switching fabric is unresponsive. A hardware fault has caused the backplane to fail. Power-cycling does not restore operation. A spare switch with the same model is available with a configuration backup on file.",
      "question": "How do you proceed?",
      "options": [
        { "label": "A", "text": "Begin physical replacement by racking the spare switch, restoring configuration from backup, and preparing to reconnect all uplinks in a controlled sequence.", "outcome": { "type": "node", "target": "node-3" } },
        { "label": "B", "text": "Attempt to repair the switching fabric on the live failed unit while servers remain disconnected.", "outcome": { "type": "failure" } }
      ]
    },
    "node-3": {
      "title": "Replacement Switch Configuration",
      "situation": "The spare switch is racked and powered on. The configuration backup is 3 days old and may be missing some recent VLAN additions. Before reconnecting uplinks, you need to decide how to handle the potentially stale configuration.",
      "question": "What do you do?",
      "options": [
        { "label": "A", "text": "Restore the 3-day-old configuration, reconnect uplinks, verify connectivity for all segments, and manually add any missing VLAN configurations identified from change logs.", "outcome": { "type": "node", "target": "node-4" } },
        { "label": "B", "text": "Skip configuration restoration and manually configure the switch from scratch during the outage to ensure it is current.", "outcome": { "type": "failure" } }
      ]
    },
    "node-4": {
      "title": "Connectivity Validation",
      "situation": "The replacement switch is active and most servers have regained connectivity. Two VLANs are missing from the configuration. Change logs show these were added 2 days ago.",
      "question": "What is your next step?",
      "options": [
        { "label": "A", "text": "Add the two missing VLANs from the change log, verify full connectivity for all servers, update the configuration backup immediately, and schedule a review of the switch backup process.", "outcome": { "type": "node", "target": "node-5" } },
        { "label": "B", "text": "Leave the two missing VLANs and close the incident, expecting the teams that own those VLANs to notice and report separately.", "outcome": { "type": "failure" } }
      ]
    },
    "node-5": {
      "title": "Scenario Complete",
      "situation": "You successfully diagnosed the switch hardware failure, executed a controlled replacement using a spare unit, restored configuration from backup, applied missing changes from the change log, and identified a gap in the backup frequency process.",
      "question": "Scenario complete. Well done!",
      "options": []
    }
  },
  "category": "IT Operations",
  "difficulty": "Intermediate",
  "tags": ["network", "switch", "hardware-failure", "connectivity"]
}'

# 5. scenario_router_misconfiguration.json
write_scenario "scenario_router_misconfiguration.json" '{
  "title": "router_misconfiguration",
  "description": "A misconfigured router causes routing loops and network instability after a change window.",
  "timeline": [
    { "index": 0, "title": "Change Window Closes", "description": "A planned router configuration change is applied and the change window closes.", "timeOffsetSec": 5 },
    { "index": 1, "title": "Routing Instability Detected", "description": "BGP neighbors begin flapping and CPU utilization on the router spikes to 100%.", "timeOffsetSec": 20 },
    { "index": 2, "title": "Network Degradation Spreads", "description": "Routing loops cause packet loss across multiple network segments. User-facing services degrade.", "timeOffsetSec": 60 },
    { "index": 3, "title": "Change Identified as Root Cause", "description": "Network team correlates timing and identifies the recent change introduced an incorrect static route.", "timeOffsetSec": 120 },
    { "index": 4, "title": "Configuration Rollback Initiated", "description": "Engineers begin rolling back the router configuration to the pre-change baseline.", "timeOffsetSec": 180 },
    { "index": 5, "title": "Network Stability Restored", "description": "Rollback completes. BGP sessions re-establish and routing tables converge normally.", "timeOffsetSec": 300 }
  ],
  "root": "node-1",
  "nodes": {
    "node-1": {
      "title": "Post-Change Network Instability",
      "situation": "Minutes after a planned router configuration change, network monitoring shows BGP flapping, routing loops, and 100% CPU on the core router. Multiple services are degraded. The change was applied by a junior engineer and the pre-change configuration was saved.",
      "question": "What is your immediate action?",
      "options": [
        { "label": "A", "text": "Declare an incident, halt any further changes, review the change log to identify what was modified, and assess whether an immediate rollback is warranted.", "outcome": { "type": "node", "target": "node-2" } },
        { "label": "B", "text": "Apply additional configuration changes to try to fix the routing loop without reviewing what the previous change did.", "outcome": { "type": "failure" } },
        { "label": "C", "text": "Reboot the router immediately to clear the routing table and BGP sessions.", "outcome": { "type": "failure" } }
      ]
    },
    "node-2": {
      "title": "Root Cause Analysis",
      "situation": "The change log shows a new static route was added that points a /16 network back through the router itself, creating a routing loop. BGP is consuming all CPU trying to propagate the looping routes. The pre-change config backup is confirmed clean.",
      "question": "How do you proceed?",
      "options": [
        { "label": "A", "text": "Immediately remove the incorrect static route to break the routing loop, then monitor BGP convergence before applying a full rollback to the clean baseline.", "outcome": { "type": "node", "target": "node-3" } },
        { "label": "B", "text": "Perform a full router reboot to clear all state, which will also drop all BGP sessions for several minutes.", "outcome": { "type": "failure" } }
      ]
    },
    "node-3": {
      "title": "BGP Recovery",
      "situation": "The incorrect static route has been removed. Router CPU has dropped to 35%. BGP sessions are re-establishing but two peers have not yet converged. You need to decide whether to wait or intervene.",
      "question": "What do you do?",
      "options": [
        { "label": "A", "text": "Monitor BGP session recovery passively for 5 minutes, then use soft-reset commands on unconverged peers if they do not re-establish naturally.", "outcome": { "type": "node", "target": "node-4" } },
        { "label": "B", "text": "Immediately hard-reset all BGP sessions to force rapid reconvergence, causing a temporary complete routing outage.", "outcome": { "type": "failure" } }
      ]
    },
    "node-4": {
      "title": "Full Rollback and Validation",
      "situation": "All BGP sessions have converged. The network is stable. You now need to apply the full rollback to the clean baseline config and establish safeguards to prevent this recurrence.",
      "question": "What is your next step?",
      "options": [
        { "label": "A", "text": "Apply the full baseline rollback during a brief maintenance window, validate routing tables, implement a peer-review requirement for all router changes, and document the incident.", "outcome": { "type": "node", "target": "node-5" } },
        { "label": "B", "text": "Leave the current partial configuration in place since BGP is stable and avoid the rollback to reduce risk.", "outcome": { "type": "failure" } }
      ]
    },
    "node-5": {
      "title": "Scenario Complete",
      "situation": "You effectively identified the misconfigured static route causing the routing loop, surgically removed it to restore stability, allowed BGP to converge naturally, and implemented a peer-review change control improvement.",
      "question": "Scenario complete. Well done!",
      "options": []
    }
  },
  "category": "IT Operations",
  "difficulty": "Intermediate",
  "tags": ["router", "BGP", "routing-loop", "change-management"]
}'

# 6. scenario_power_supply_failure.json
write_scenario "scenario_power_supply_failure.json" '{
  "title": "power_supply_failure",
  "description": "A server power supply unit fails, causing an unexpected server shutdown.",
  "timeline": [
    { "index": 0, "title": "Server Shuts Down", "description": "A production server powers off unexpectedly. Monitoring detects loss of all connectivity and fires a P1 alert.", "timeOffsetSec": 5 },
    { "index": 1, "title": "Physical Inspection", "description": "Datacenter technician inspects the server. PSU fault LED is illuminated. No power is being delivered.", "timeOffsetSec": 20 },
    { "index": 2, "title": "Redundant PSU Check", "description": "Technician verifies whether the server has a redundant PSU that should have taken over.", "timeOffsetSec": 60 },
    { "index": 3, "title": "PSU Replacement Sourced", "description": "A compatible replacement PSU is retrieved from spare parts inventory.", "timeOffsetSec": 120 },
    { "index": 4, "title": "PSU Replaced and Server Restarted", "description": "Faulty PSU is hot-swapped (if supported) or server is powered down for replacement.", "timeOffsetSec": 180 },
    { "index": 5, "title": "Server Back Online", "description": "Server boots successfully with the new PSU. Services resume and monitoring confirms normal operation.", "timeOffsetSec": 300 }
  ],
  "root": "node-1",
  "nodes": {
    "node-1": {
      "title": "Unexpected Server Shutdown",
      "situation": "A production server has powered off without warning. The PSU fault LED is illuminated. The server has dual PSU slots but the secondary PSU did not take over. Services on this server are offline and users are impacted.",
      "question": "What is your immediate action?",
      "options": [
        { "label": "A", "text": "Notify stakeholders of the outage, physically inspect both PSU slots to determine why the redundant PSU failed to take over, and check spare parts inventory for a compatible replacement.", "outcome": { "type": "node", "target": "node-2" } },
        { "label": "B", "text": "Attempt to power on the server with the faulty PSU still installed to verify it is actually broken.", "outcome": { "type": "failure" } },
        { "label": "C", "text": "Begin migrating all services to another server before investigating the PSU failure.", "outcome": { "type": "failure" } }
      ]
    },
    "node-2": {
      "title": "Redundancy Investigation",
      "situation": "Physical inspection reveals the secondary PSU slot is empty — the second PSU was never installed. This means there was no actual redundancy. A compatible replacement PSU is available in the spare parts room. The server supports hot-swap PSU replacement.",
      "question": "How do you proceed?",
      "options": [
        { "label": "A", "text": "Hot-swap the failed PSU with the replacement unit. The server should power on automatically once a working PSU is detected.", "outcome": { "type": "node", "target": "node-3" } },
        { "label": "B", "text": "Install the replacement PSU in the secondary slot without removing the failed primary PSU first.", "outcome": { "type": "failure" } }
      ]
    },
    "node-3": {
      "title": "Server Boot Validation",
      "situation": "The replacement PSU is installed and the server has powered on. The OS is booting. You need to verify the server comes back to a healthy state and all services restart correctly.",
      "question": "What do you do?",
      "options": [
        { "label": "A", "text": "Monitor the boot process via the console, verify all services start correctly, run health checks, and confirm monitoring returns to green status.", "outcome": { "type": "node", "target": "node-4" } },
        { "label": "B", "text": "Walk away after the server powers on and assume services will restart without verification.", "outcome": { "type": "failure" } }
      ]
    },
    "node-4": {
      "title": "Root Cause and Prevention",
      "situation": "The server is fully operational. The incident lasted 22 minutes. You discover through the CMDB that several other servers in the rack also have only one PSU installed despite being listed as having redundant power.",
      "question": "What is your next step?",
      "options": [
        { "label": "A", "text": "Document the incident, audit all servers flagged as redundant in the CMDB for actual PSU count, and raise a change request to install missing secondary PSUs during the next maintenance window.", "outcome": { "type": "node", "target": "node-5" } },
        { "label": "B", "text": "Close the incident ticket and only address the other servers if they also fail.", "outcome": { "type": "failure" } }
      ]
    },
    "node-5": {
      "title": "Scenario Complete",
      "situation": "You resolved the PSU failure through a hot-swap, restored services, and identified a systemic CMDB inaccuracy where servers were incorrectly documented as having redundant power supplies. A proactive audit and remediation plan is underway.",
      "question": "Scenario complete. Well done!",
      "options": []
    }
  },
  "category": "IT Operations",
  "difficulty": "Beginner",
  "tags": ["power-supply", "hardware", "redundancy", "datacenter"]
}'

# 7. scenario_cooling_system_failure.json
write_scenario "scenario_cooling_system_failure.json" '{
  "title": "cooling_system_failure",
  "description": "A datacenter cooling unit fails, causing rising temperatures that threaten server hardware.",
  "timeline": [
    { "index": 0, "title": "Temperature Alert Triggered", "description": "Environmental monitoring detects rack temperatures rising above 27°C threshold. CRAC unit alarm is active.", "timeOffsetSec": 5 },
    { "index": 1, "title": "CRAC Unit Failure Confirmed", "description": "Facilities team confirms a computer room air conditioning unit has failed. Temperatures are rising 2°C per minute.", "timeOffsetSec": 20 },
    { "index": 2, "title": "Critical Threshold Approaching", "description": "Rack temperatures reach 35°C. Servers begin thermal throttling. Some hardware starts shutting down for self-protection.", "timeOffsetSec": 60 },
    { "index": 3, "title": "Emergency Cooling Requested", "description": "Emergency portable cooling units are requested while HVAC engineers are dispatched.", "timeOffsetSec": 120 },
    { "index": 4, "title": "Non-Critical Workloads Migrated", "description": "Non-critical servers are gracefully shut down or migrated to reduce heat generation.", "timeOffsetSec": 180 },
    { "index": 5, "title": "Cooling Restored", "description": "Portable units lower temperatures. Primary CRAC unit is repaired. All servers operational.", "timeOffsetSec": 300 }
  ],
  "root": "node-1",
  "nodes": {
    "node-1": {
      "title": "Datacenter Temperature Rising",
      "situation": "Environmental monitoring shows rack temperatures rising rapidly after a CRAC unit failure. Current temperature is 33°C and climbing. Server self-protection shutdowns have begun. You have authority to initiate emergency procedures.",
      "question": "What is your immediate action?",
      "options": [
        { "label": "A", "text": "Activate the datacenter thermal emergency procedure: notify facilities for HVAC repair, request portable cooling units, and prepare to gracefully shut down non-critical systems.", "outcome": { "type": "node", "target": "node-2" } },
        { "label": "B", "text": "Open all datacenter doors to allow ambient building air to cool the racks.", "outcome": { "type": "failure" } },
        { "label": "C", "text": "Wait for the CRAC unit to self-recover before taking any action.", "outcome": { "type": "failure" } }
      ]
    },
    "node-2": {
      "title": "Emergency Cooling Prioritization",
      "situation": "Facilities confirms repair will take 90 minutes. Portable coolers will arrive in 20 minutes. Temperature is now 38°C. You must decide which workloads to shut down to reduce heat load while protecting critical services.",
      "question": "How do you proceed?",
      "options": [
        { "label": "A", "text": "Using the CMDB, identify and gracefully shut down non-critical servers (dev/test/batch), while keeping production and DR systems running, to reduce thermal load until cooling is restored.", "outcome": { "type": "node", "target": "node-3" } },
        { "label": "B", "text": "Shut down all servers immediately including production systems to protect hardware from thermal damage.", "outcome": { "type": "failure" } }
      ]
    },
    "node-3": {
      "title": "Portable Cooling Deployment",
      "situation": "Non-critical servers are shut down. Portable coolers have arrived. Temperature has stabilized at 41°C but is no longer climbing. You need to position the portable units for maximum effectiveness.",
      "question": "What do you do?",
      "options": [
        { "label": "A", "text": "Position portable coolers to direct cold air into the hottest aisles using hot-aisle/cold-aisle containment principles, and continuously monitor temperatures until the primary unit is repaired.", "outcome": { "type": "node", "target": "node-4" } },
        { "label": "B", "text": "Place all portable coolers in one corner of the room and assume they will cool the entire space evenly.", "outcome": { "type": "failure" } }
      ]
    },
    "node-4": {
      "title": "Recovery and Restart",
      "situation": "The primary CRAC unit is repaired. Temperatures have dropped back to 24°C. You need to safely restore the shut-down systems and validate the environment.",
      "question": "What is your next step?",
      "options": [
        { "label": "A", "text": "Gradually power on non-critical servers in staged batches to avoid a power surge, verify hardware health after the thermal event, and document the incident with a review of cooling redundancy.", "outcome": { "type": "node", "target": "node-5" } },
        { "label": "B", "text": "Power on all servers simultaneously as quickly as possible to restore full capacity.", "outcome": { "type": "failure" } }
      ]
    },
    "node-5": {
      "title": "Scenario Complete",
      "situation": "You responded to the cooling failure by activating emergency procedures, selectively shutting down non-critical workloads, deploying portable cooling effectively, and overseeing a staged recovery once primary cooling was restored.",
      "question": "Scenario complete. Well done!",
      "options": []
    }
  },
  "category": "IT Operations",
  "difficulty": "Beginner",
  "tags": ["cooling", "datacenter", "HVAC", "thermal-management"]
}'

# 8. scenario_eol_hardware_failure.json
write_scenario "scenario_eol_hardware_failure.json" '{
  "title": "eol_hardware_failure",
  "description": "End-of-life hardware fails with no vendor support available, requiring an emergency migration.",
  "timeline": [
    { "index": 0, "title": "Legacy Server Failure", "description": "A server that reached end-of-life 2 years ago fails. The hardware is no longer supported by the vendor.", "timeOffsetSec": 5 },
    { "index": 1, "title": "No Vendor Support Available", "description": "Support ticket opened with vendor is immediately rejected. Hardware is past EOL with no spare parts available.", "timeOffsetSec": 20 },
    { "index": 2, "title": "Application Inventory Review", "description": "Teams scramble to document what applications were running on the EOL server.", "timeOffsetSec": 60 },
    { "index": 3, "title": "Emergency Provisioning", "description": "New virtual or cloud infrastructure is provisioned as an emergency replacement.", "timeOffsetSec": 120 },
    { "index": 4, "title": "Application Migration", "description": "Applications are migrated and reconfigured on the new infrastructure.", "timeOffsetSec": 180 },
    { "index": 5, "title": "Services Restored", "description": "All workloads are operational on new infrastructure. EOL hardware decommissioned.", "timeOffsetSec": 300 }
  ],
  "root": "node-1",
  "nodes": {
    "node-1": {
      "title": "EOL Server Has Failed",
      "situation": "A server that has been past vendor end-of-life for 2 years has failed with a motherboard fault. No spare parts exist. The server hosts 3 business-critical applications. The CMDB entry for this server is incomplete and the applications on it are not well documented.",
      "question": "What is your immediate action?",
      "options": [
        { "label": "A", "text": "Declare a P1 incident, notify application owners to identify running workloads from logs and documentation, and begin provisioning emergency replacement infrastructure in parallel.", "outcome": { "type": "node", "target": "node-2" } },
        { "label": "B", "text": "Spend time searching for third-party refurbished parts before taking any other action.", "outcome": { "type": "failure" } },
        { "label": "C", "text": "Restore a backup to the same failing hardware without addressing the underlying hardware fault.", "outcome": { "type": "failure" } }
      ]
    },
    "node-2": {
      "title": "Application Discovery",
      "situation": "Application owners have identified the 3 workloads: a legacy CRM, a file share, and a batch processing job. Only the CRM has current documentation. The file share and batch job configs must be recovered from disk backups of the failed server.",
      "question": "How do you proceed?",
      "options": [
        { "label": "A", "text": "Mount the failed server's disk in a recovery mode environment to retrieve application configs and data, while provisioning new VM infrastructure for all three workloads.", "outcome": { "type": "node", "target": "node-3" } },
        { "label": "B", "text": "Only restore the documented CRM application and postpone the others until full documentation is available.", "outcome": { "type": "failure" } }
      ]
    },
    "node-3": {
      "title": "Emergency Migration",
      "situation": "Application configs and data have been recovered. New VMs are provisioned. You need to migrate the applications and validate them before directing users back to the services.",
      "question": "What do you do?",
      "options": [
        { "label": "A", "text": "Migrate each application to the new VMs, run smoke tests for each service, update DNS records, and confirm with application owners that functionality is restored before closing.", "outcome": { "type": "node", "target": "node-4" } },
        { "label": "B", "text": "Update DNS to point to the new VMs before testing the applications, to restore access as quickly as possible.", "outcome": { "type": "failure" } }
      ]
    },
    "node-4": {
      "title": "Post-Incident Hardening",
      "situation": "All three applications are migrated and operational. This incident exposed a gap: multiple EOL servers still exist in the datacenter. Management asks what should be done to prevent this from happening again.",
      "question": "What is your next step?",
      "options": [
        { "label": "A", "text": "Conduct a full EOL hardware audit, create a prioritized replacement roadmap with business impact assessments, update the CMDB, and establish an EOL monitoring process with proactive alerts before EOL dates.", "outcome": { "type": "node", "target": "node-5" } },
        { "label": "B", "text": "Replace EOL hardware only as it fails, since proactive replacement is too costly to justify.", "outcome": { "type": "failure" } }
      ]
    },
    "node-5": {
      "title": "Scenario Complete",
      "situation": "You managed a complex EOL hardware failure with incomplete documentation, successfully recovered application data, migrated all workloads to new infrastructure, and initiated a proactive EOL replacement program.",
      "question": "Scenario complete. Well done!",
      "options": []
    }
  },
  "category": "IT Operations",
  "difficulty": "Intermediate",
  "tags": ["EOL", "hardware", "legacy", "migration"]
}'

echo "Hardware scenarios (1-8) written."
