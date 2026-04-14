/**
 * Author: Leon Wasiliew
 * Last Update: 2026-04-14
 * Description: Template-based AI scenario generation for the Scenario Builder.
 * Generates complete scenario structures (timeline, decision nodes, objectives, discussion prompts)
 * from a short organisational profile (industry, threat type, key assets, org size).
 */

/** Fills template placeholders with the provided context values. */
function fill(template, ctx) {
    return template
        .replace(/\{industry\}/g, ctx.industry || "the organisation")
        .replace(/\{org\}/g, ctx.org || "the organisation")
        .replace(/\{primaryAsset\}/g, ctx.primaryAsset || "critical systems")
        .replace(/\{secondaryAsset\}/g, ctx.secondaryAsset || "supporting infrastructure")
        .replace(/\{teamSize\}/g, ctx.teamSize || "the response team")
        .replace(/\{region\}/g, ctx.region || "the region");
}

/** Returns a simple slug-safe unique ID for decision nodes. */
function nodeId(n) { return `node-${n}`; }

// ─────────────────────────────────────────────────────────────────────────────
// Threat templates
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES = {

    ransomware: {
        category: "Cyber",
        difficulty: "Advanced",
        tags: ["ransomware", "encryption", "incident response", "backup"],
        getTitle: (ctx) => `Ransomware Attack – ${ctx.industry}`,
        getDescription: (ctx) =>
            `Ransomware propagates across {org}'s network, encrypting {primaryAsset} and demanding payment.`.replace(/\{org\}/g, ctx.org || "the organisation").replace(/\{primaryAsset\}/g, ctx.primaryAsset || "critical data"),

        getObjectives: () => [
            "Identify and isolate infected endpoints within 30 minutes of detection.",
            "Preserve a complete audit trail of all containment and recovery actions.",
            "Evaluate backup integrity before initiating any restoration.",
            "Coordinate external communications with legal, PR, and regulators.",
            "Conduct a post-incident lessons-learned review within 72 hours.",
        ],

        getDiscussionPrompts: () => [
            "At what point should you notify senior leadership and legal counsel?",
            "What criteria determine whether to pay the ransom or restore from backup?",
            "How would you verify that backups are unaffected before restoring production?",
            "What communication should go to affected staff, customers, and regulators?",
            "How would your response differ if the attacker threatened to publish data publicly?",
        ],

        getTimeline: (ctx) => [
            { index: 0,  title: "Endpoint Alert Triggered",         description: `Endpoint protection flags mass file-rename activity on a {industry} workstation. The user reports files are unreadable.`.replace(/\{industry\}/g, ctx.industry), timeOffsetSec: 5 },
            { index: 1,  title: "Encryption Spreading",             description: "Four additional workstations show identical symptoms. Shared drive access is returning garbled files.", timeOffsetSec: 25 },
            { index: 2,  title: "Network Shares Targeted",          description: `Encryption spreading to mapped drives. {primaryAsset} files and HR records affected.`.replace(/\{primaryAsset\}/g, ctx.primaryAsset || "critical"), timeOffsetSec: 50 },
            { index: 3,  title: "Ransom Note Discovered",           description: "A README_RESTORE.txt appears in every encrypted folder. Attackers demand payment within 72 hours.", timeOffsetSec: 90 },
            { index: 4,  title: "IR Team Assembled",                description: `{teamSize} convened. Initial scope assessment underway.`.replace(/\{teamSize\}/g, ctx.teamSize || "The IR team"), timeOffsetSec: 120 },
            { index: 5,  title: "Backup Status Check",              description: "IT verifying offline backup integrity. Last clean backup taken 18 hours ago.", timeOffsetSec: 150 },
            { index: 6,  title: "Legal and PR Notified",            description: "Legal counsel and communications team briefed. Regulatory notification window under assessment.", timeOffsetSec: 200 },
            { index: 7,  title: "Law Enforcement Contact",          description: "Decision on whether to engage law enforcement and report to national CERT.", timeOffsetSec: 250 },
            { index: 8,  title: "Restore Decision",                 description: "Management requests a decision: restore from backup or negotiate. Backup verified as clean.", timeOffsetSec: 300 },
            { index: 9,  title: "Recovery Underway",                description: "Restoration from air-gapped backup initiated. Affected systems rebuilt from clean images.", timeOffsetSec: 360 },
            { index: 10, title: "Monitoring for Re-infection",      description: "Enhanced monitoring deployed. EDR signatures updated to detect reoccurrence.", timeOffsetSec: 420 },
            { index: 11, title: "Post-Incident Review",             description: "Systems restored. Lessons-learned session scheduled. Backup cadence and EDR rules under review.", timeOffsetSec: 480 },
        ],

        getNodes: (ctx) => ({
            [nodeId(1)]: {
                title: "Endpoint Alert: Mass File Encryption",
                situation: `Your endpoint tool alerts on mass file-rename activity consistent with ransomware on a {industry} workstation. The affected user says files are unreadable and a ransom note has appeared.`.replace(/\{industry\}/g, ctx.industry || ""),
                question: "What is your immediate action?",
                options: [
                    { label: "A", text: "Isolate the workstation from the network immediately, then alert the IR team.", outcome: { type: "node", target: nodeId(2) } },
                    { label: "B", text: "Run an antivirus scan while the machine stays connected to diagnose first.", outcome: { type: "failure" } },
                    { label: "C", text: "Reboot the workstation to see if the activity stops.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(2)]: {
                title: "Multiple Systems Affected",
                situation: "Four additional workstations exhibit the same symptoms. Ransomware is spreading via mapped network drives. The IR team awaits direction.",
                question: "How do you contain the outbreak?",
                options: [
                    { label: "A", text: "Segment the affected VLAN and block SMB traffic at the firewall.", outcome: { type: "node", target: nodeId(3) } },
                    { label: "B", text: "Shut down only the original machine and continue monitoring the others.", outcome: { type: "failure" } },
                    { label: "C", text: "Take the entire network offline to halt all activity.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(3)]: {
                title: "Ransom Demand Received",
                situation: "Containment is holding. Attackers demand payment within 72 hours. Management asks whether to pay. No guarantee of decryption key delivery.",
                question: "How do you advise management?",
                options: [
                    { label: "A", text: "Do not pay. Assess backup availability and engage law enforcement. Document everything.", outcome: { type: "node", target: nodeId(4) } },
                    { label: "B", text: "Pay the ransom immediately to restore operations as quickly as possible.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(4)]: {
                title: "Backup Integrity Verification",
                situation: `An air-gapped backup of {primaryAsset} from 18 hours ago has been located. Before restoring, you must verify it is clean.`.replace(/\{primaryAsset\}/g, ctx.primaryAsset || "critical data"),
                question: "How do you validate the backup?",
                options: [
                    { label: "A", text: "Mount the backup on an isolated test system, run integrity checks and malware scans before restoring production.", outcome: { type: "node", target: nodeId(5) } },
                    { label: "B", text: "Restore directly to production to minimise downtime.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(5)]: {
                title: "Scenario Complete",
                situation: "Backup integrity confirmed. Systems restored from clean images. Law enforcement notified. A post-incident review is scheduled to improve detection, backup cadence, and staff awareness.",
                question: "Scenario complete. Well done!",
                options: [],
            },
        }),
    },

    // ── Phishing / Business E-mail Compromise ────────────────────────────────
    phishing: {
        category: "Cyber",
        difficulty: "Intermediate",
        tags: ["phishing", "BEC", "social engineering", "credential theft"],
        getTitle: (ctx) => `Phishing & Credential Theft – ${ctx.industry}`,
        getDescription: (ctx) =>
            `A targeted phishing campaign harvests credentials from {org} staff, enabling account takeover.`.replace(/\{org\}/g, ctx.org || "the organisation"),

        getObjectives: () => [
            "Identify and quarantine all phishing e-mails within the mail environment.",
            "Reset credentials and enforce MFA for all affected accounts within one hour.",
            "Determine the scope of data that was accessible from compromised accounts.",
            "Notify affected users with clear guidance on what they should do next.",
            "Review and update e-mail filtering rules to prevent recurrence.",
        ],

        getDiscussionPrompts: () => [
            "How do you prioritise which accounts to investigate first?",
            "At what point do you involve HR or legal when employee accounts are involved?",
            "How would you communicate the incident to staff without causing panic?",
            "What additional controls would reduce the risk of a future phishing campaign succeeding?",
            "How do you determine if the compromised accounts were used to send further phishing e-mails?",
        ],

        getTimeline: (ctx) => [
            { index: 0,  title: "Suspicious E-mail Reported",        description: "A staff member forwards a suspicious e-mail to the security team. The e-mail impersonates the CEO.", timeOffsetSec: 5 },
            { index: 1,  title: "Phishing Campaign Identified",       description: "Security discovers 47 similar e-mails delivered to staff over the past 6 hours. Links lead to a credential-harvesting page.", timeOffsetSec: 20 },
            { index: 2,  title: "Click-through Rate Assessed",        description: "12 staff clicked the link. 8 entered their credentials on the fake login page.", timeOffsetSec: 40 },
            { index: 3,  title: "Credential Compromise Confirmed",    description: "Azure AD shows unusual logins from overseas IP addresses for 3 compromised accounts.", timeOffsetSec: 70 },
            { index: 4,  title: "Active Account Takeover",            description: `One compromised account accessed {primaryAsset}. Attacker set up forwarding rules.`.replace(/\{primaryAsset\}/g, ctx.primaryAsset || "sensitive files"), timeOffsetSec: 100 },
            { index: 5,  title: "IR Team Notified",                   description: `{teamSize} assembled. Scope assessment under way.`.replace(/\{teamSize\}/g, ctx.teamSize || "IR team"), timeOffsetSec: 130 },
            { index: 6,  title: "E-mail Quarantine Executed",         description: "All phishing e-mails purged from the mail environment. Domain blocked at gateway.", timeOffsetSec: 160 },
            { index: 7,  title: "Credential Reset Wave 1",            description: "Credentials for 8 confirmed compromised accounts reset. MFA enforcement issued.", timeOffsetSec: 200 },
            { index: 8,  title: "Forensic Review of Access Logs",     description: "Reviewing what data the attacker accessed during the takeover window.", timeOffsetSec: 250 },
            { index: 9,  title: "Notification to Affected Users",     description: "Affected staff notified with instructions. Management briefed on data exposure scope.", timeOffsetSec: 300 },
            { index: 10, title: "E-mail Filter Rule Update",          description: "SPF / DKIM / DMARC reviewed. New detection rules deployed to mail gateway.", timeOffsetSec: 360 },
            { index: 11, title: "Post-Incident Review",               description: "Full incident timeline documented. Awareness training campaign launched for all staff.", timeOffsetSec: 420 },
        ],

        getNodes: () => ({
            [nodeId(1)]: {
                title: "Phishing E-mails Identified",
                situation: "47 phishing e-mails impersonating the CEO were delivered to staff. 12 staff clicked the link. 8 entered credentials on a fake login page.",
                question: "What is your immediate priority?",
                options: [
                    { label: "A", text: "Quarantine all phishing e-mails and identify all accounts that clicked the link before resetting credentials.", outcome: { type: "node", target: nodeId(2) } },
                    { label: "B", text: "Immediately reset passwords for all 500 staff accounts to minimise risk.", outcome: { type: "failure" } },
                    { label: "C", text: "Wait for more information before acting to avoid disrupting business operations.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(2)]: {
                title: "Active Account Takeover Detected",
                situation: "Unusual logins from overseas IP addresses are detected on 3 accounts. One account has accessed sensitive files and set up e-mail forwarding to an external address.",
                question: "How do you respond?",
                options: [
                    { label: "A", text: "Revoke active sessions, reset credentials, and remove the forwarding rule. Preserve logs for forensics.", outcome: { type: "node", target: nodeId(3) } },
                    { label: "B", text: "Monitor the attacker's activity to gather intelligence before intervening.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(3)]: {
                title: "Data Exposure Scope Assessment",
                situation: "The compromised account had access to finance files and HR records for 2 hours. You need to assess what data may have been exfiltrated.",
                question: "How do you assess data exposure?",
                options: [
                    { label: "A", text: "Review DLP logs, file access logs, and e-mail content to determine what was viewed, downloaded, or forwarded.", outcome: { type: "node", target: nodeId(4) } },
                    { label: "B", text: "Assume the worst and immediately notify all customers and staff of a data breach.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(4)]: {
                title: "Notification Decision",
                situation: "Evidence shows the attacker downloaded a file containing 200 customer e-mail addresses. Regulatory notification may be required.",
                question: "What is your notification decision?",
                options: [
                    { label: "A", text: "Consult legal counsel and notify the regulator within the required window. Notify affected customers with clear guidance.", outcome: { type: "node", target: nodeId(5) } },
                    { label: "B", text: "Decide not to notify to avoid reputational damage. The data exposed was minimal.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(5)]: {
                title: "Scenario Complete",
                situation: "Credentials reset, e-mail environment cleaned, data exposure assessed, and notifications sent. A phishing simulation exercise is scheduled for all staff.",
                question: "Scenario complete. Well done!",
                options: [],
            },
        }),
    },

    // ── Insider Threat ───────────────────────────────────────────────────────
    insider: {
        category: "Cyber",
        difficulty: "Advanced",
        tags: ["insider threat", "data exfiltration", "privilege abuse", "DLP"],
        getTitle: (ctx) => `Insider Data Exfiltration – ${ctx.industry}`,
        getDescription: (ctx) =>
            `A malicious insider at {org} is exfiltrating {primaryAsset} to a personal device before resignation.`.replace(/\{org\}/g, ctx.org || "the organisation").replace(/\{primaryAsset\}/g, ctx.primaryAsset || "intellectual property"),

        getObjectives: () => [
            "Detect and confirm unauthorised data access or exfiltration by an internal user.",
            "Preserve forensic evidence suitable for HR disciplinary action or legal proceedings.",
            "Revoke access and recover or quarantine exfiltrated data where possible.",
            "Assess the business impact and regulatory implications of the disclosure.",
            "Review access controls and DLP policies to prevent recurrence.",
        ],

        getDiscussionPrompts: () => [
            "At what point do you involve HR and legal in an insider threat investigation?",
            "How do you balance employee privacy rights with the need to investigate?",
            "What evidence would you need to support a termination and potential criminal referral?",
            "How would you handle the situation if the employee resigned before you completed the investigation?",
            "What controls would have detected or prevented this exfiltration earlier?",
        ],

        getTimeline: (ctx) => [
            { index: 0,  title: "DLP Alert Triggered",               description: `DLP tool flags large file transfers to a personal cloud storage account from a {industry} user's workstation.`.replace(/\{industry\}/g, ctx.industry || ""), timeOffsetSec: 5 },
            { index: 1,  title: "Initial Alert Triage",              description: "Security analyst reviews the alert. Transfers include compressed archives of project files.", timeOffsetSec: 20 },
            { index: 2,  title: "User Identified",                   description: "The flagged account belongs to a senior employee who recently submitted their resignation notice.", timeOffsetSec: 45 },
            { index: 3,  title: "Scope of Transfers Assessed",       description: `Over 4 GB of {primaryAsset} transferred over 3 weeks via USB and cloud sync.`.replace(/\{primaryAsset\}/g, ctx.primaryAsset || "confidential data"), timeOffsetSec: 80 },
            { index: 4,  title: "HR and Legal Notified",             description: "HR and in-house legal counsel briefed. A covert investigation authorised.", timeOffsetSec: 110 },
            { index: 5,  title: "Evidence Preservation",             description: "Forensic image of the workstation taken. Cloud access logs preserved. Chain of custody documented.", timeOffsetSec: 150 },
            { index: 6,  title: "Continued Monitoring",              description: "User's activity monitored in real time. Additional transfers detected to USB device.", timeOffsetSec: 200 },
            { index: 7,  title: "Escalation Decision",               description: "Evidence sufficient to proceed. Decision required: confront now or wait for final day.", timeOffsetSec: 250 },
            { index: 8,  title: "Access Revocation",                 description: "Account suspended. VPN and cloud access revoked. IT secures the workstation.", timeOffsetSec: 300 },
            { index: 9,  title: "Interview and Disclosure",          description: "HR-led interview conducted. Employee denies intent. USB device surrendered.", timeOffsetSec: 350 },
            { index: 10, title: "Regulatory and Legal Review",       description: "Legal assesses whether regulatory notification is required. Police referral considered.", timeOffsetSec: 400 },
            { index: 11, title: "Control Review and Remediation",    description: "Access controls, off-boarding procedures, and DLP policies reviewed and updated.", timeOffsetSec: 460 },
        ],

        getNodes: () => ({
            [nodeId(1)]: {
                title: "DLP Alert: Large Exfiltration Detected",
                situation: "A DLP alert flags 4 GB of compressed project archives transferred to personal cloud storage over 3 weeks from a resigning employee's workstation.",
                question: "What is your immediate response?",
                options: [
                    { label: "A", text: "Escalate to security leadership and begin a covert forensic investigation before notifying the user.", outcome: { type: "node", target: nodeId(2) } },
                    { label: "B", text: "Confront the employee immediately with the alert.", outcome: { type: "failure" } },
                    { label: "C", text: "Dismiss the alert as likely personal backup and take no action.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(2)]: {
                title: "Evidence Preservation Decision",
                situation: "Legal counsel authorises a covert investigation. You need to preserve evidence for potential disciplinary action or criminal referral.",
                question: "How do you preserve evidence?",
                options: [
                    { label: "A", text: "Take a forensic image of the workstation, preserve cloud and DLP logs, and document the chain of custody.", outcome: { type: "node", target: nodeId(3) } },
                    { label: "B", text: "Copy files from the workstation yourself and store them on a shared network drive.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(3)]: {
                title: "Escalation Timing",
                situation: "Evidence is strong. The employee has 2 days remaining before their last day. Another USB transfer was detected today.",
                question: "When do you act?",
                options: [
                    { label: "A", text: "Act now: revoke access, conduct an HR-led interview, and secure the USB device before more data leaves.", outcome: { type: "node", target: nodeId(4) } },
                    { label: "B", text: "Wait for their final day to avoid disruption and risk the employee destroying evidence.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(4)]: {
                title: "Interview Outcome",
                situation: "During the HR interview the employee denies malicious intent but surrenders the USB device. 3.8 GB of company data is confirmed present.",
                question: "What is your next step?",
                options: [
                    { label: "A", text: "Wipe or recover the data under legal supervision. Assess regulatory notification obligations and consider a police referral.", outcome: { type: "node", target: nodeId(5) } },
                    { label: "B", text: "Accept the explanation and allow the employee to leave without further action.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(5)]: {
                title: "Scenario Complete",
                situation: "Evidence preserved, data recovered, employee terminated, and regulatory review completed. Off-boarding procedures and DLP policies have been strengthened.",
                question: "Scenario complete. Well done!",
                options: [],
            },
        }),
    },

    // ── Active Shooter / Physical Threat ─────────────────────────────────────
    active_threat: {
        category: "Threat",
        difficulty: "Advanced",
        tags: ["active threat", "evacuation", "lockdown", "emergency response"],
        getTitle: (ctx) => `Active Threat Response – ${ctx.industry}`,
        getDescription: (ctx) =>
            `An armed individual has entered {org}'s premises. Staff must execute emergency protocols.`.replace(/\{org\}/g, ctx.org || "the organisation"),

        getObjectives: () => [
            "Initiate and communicate lockdown or evacuation orders rapidly and clearly.",
            "Account for all staff and visitors within 30 minutes of the all-clear.",
            "Coordinate effectively with law enforcement from first contact.",
            "Provide first-aid support to any casualties while maintaining safety.",
            "Conduct a post-incident debrief and review communication gaps.",
        ],

        getDiscussionPrompts: () => [
            "How do you decide whether to evacuate or lock down when a threat is inside the building?",
            "At what point do you transfer command authority to law enforcement?",
            "How would you account for staff working remotely or visitors without access cards?",
            "What mental health and trauma support should be activated after the incident?",
            "What communication channels should be used when phone networks are overloaded?",
        ],

        getTimeline: (ctx) => [
            { index: 0,  title: "Threat Report Received",            description: `Security receives a report of a weapon sighted on {org}'s premises in the main lobby.`.replace(/\{org\}/g, ctx.org || ""), timeOffsetSec: 5 },
            { index: 1,  title: "CCTV Confirmation",                 description: "Security control room confirms armed individual on camera. Threat appears to be moving toward staff areas.", timeOffsetSec: 20 },
            { index: 2,  title: "Emergency Alert Issued",            description: "Building-wide alert activated. Staff instructed to shelter in place or evacuate via designated routes.", timeOffsetSec: 35 },
            { index: 3,  title: "Emergency Services Called",         description: "Triple zero (or 911/999) contacted. Location, description, and last known movement shared.", timeOffsetSec: 50 },
            { index: 4,  title: "Incident Command Activated",        description: `{teamSize} assembled at the emergency command point. Roll calls begun for all floors.`.replace(/\{teamSize\}/g, ctx.teamSize || "Crisis team"), timeOffsetSec: 70 },
            { index: 5,  title: "Shots Fired Reported",              description: "Reports of shots fired on Level 2. Casualties unknown. Responding units 4 minutes away.", timeOffsetSec: 100 },
            { index: 6,  title: "Evacuation Routes Assessed",        description: "Some exits blocked. Emergency assembly points reassigned. Mobility-impaired staff require assistance.", timeOffsetSec: 130 },
            { index: 7,  title: "Law Enforcement Arrival",           description: "Police units arrive. Incident command authority transitions. Organisation provides building plans.", timeOffsetSec: 160 },
            { index: 8,  title: "Casualty Report",                   description: "Two staff members report injuries. First-aid response initiated. Ambulances en route.", timeOffsetSec: 200 },
            { index: 9,  title: "Threat Neutralised",                description: "Police confirm threat is contained. All-clear signal pending final sweep.", timeOffsetSec: 260 },
            { index: 10, title: "Staff Accountability",              description: "Roll calls completed. One staff member unaccounted for. Search initiated.", timeOffsetSec: 310 },
            { index: 11, title: "Post-Incident Debrief",             description: "All staff accounted for. Psychological first-aid activated. Leadership debrief scheduled.", timeOffsetSec: 380 },
        ],

        getNodes: () => ({
            [nodeId(1)]: {
                title: "Armed Threat Confirmed",
                situation: "CCTV confirms an armed individual in the main lobby moving toward staff areas. The building holds 300 staff and 40 visitors. You are the designated Incident Controller.",
                question: "What is your immediate order?",
                options: [
                    { label: "A", text: "Activate the building-wide alert, instruct staff to shelter in place (Run-Hide-Defend), and call emergency services immediately.", outcome: { type: "node", target: nodeId(2) } },
                    { label: "B", text: "Send a security officer to confront the individual while you assess the situation further.", outcome: { type: "failure" } },
                    { label: "C", text: "Wait for more information to avoid a false alarm and unnecessary panic.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(2)]: {
                title: "Shots Fired – Casualties Unknown",
                situation: "Shots fired on Level 2. Police are 4 minutes away. Some staff are sheltering; others are trying to evacuate via the main stairwell, which may be compromised.",
                question: "How do you manage the evacuation?",
                options: [
                    { label: "A", text: "Direct staff away from the compromised stairwell using alternate exits. Assign wardens to assist mobility-impaired staff.", outcome: { type: "node", target: nodeId(3) } },
                    { label: "B", text: "Broadcast an all-building evacuation via all exits immediately to get everyone out as fast as possible.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(3)]: {
                title: "Police Arrive – Command Handover",
                situation: "Police arrive and request a building plan and confirmation of the last known location of the threat. They will now lead the tactical response.",
                question: "How do you support law enforcement?",
                options: [
                    { label: "A", text: "Provide floor plans, CCTV access, and a liaison officer. Stand by at the command post without interfering in tactical operations.", outcome: { type: "node", target: nodeId(4) } },
                    { label: "B", text: "Continue directing your own response teams inside the building in parallel with police.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(4)]: {
                title: "All-Clear and Accountability",
                situation: "Police give the all-clear. All staff must be accounted for. One individual is missing from the roll call. Two staff have minor injuries.",
                question: "What are your post-clearance priorities?",
                options: [
                    { label: "A", text: "Initiate a targeted search for the missing person, provide first-aid to injured staff, and activate psychological support services.", outcome: { type: "node", target: nodeId(5) } },
                    { label: "B", text: "Declare the situation resolved and allow staff to return to work immediately.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(5)]: {
                title: "Scenario Complete",
                situation: "All staff accounted for. Injuries treated. Psychological first-aid activated. A debrief and after-action review are scheduled for the following day.",
                question: "Scenario complete. Well done!",
                options: [],
            },
        }),
    },

    // ── Natural Disaster / Business Continuity ───────────────────────────────
    natural_disaster: {
        category: "Physical",
        difficulty: "Intermediate",
        tags: ["natural disaster", "business continuity", "evacuation", "recovery"],
        getTitle: (ctx) => `Natural Disaster Response – ${ctx.industry}`,
        getDescription: (ctx) =>
            `A major natural disaster event impacts {org}'s primary site, requiring activation of the Business Continuity Plan.`.replace(/\{org\}/g, ctx.org || "the organisation"),

        getObjectives: () => [
            "Execute safe evacuation and account for all staff within 45 minutes.",
            "Activate the Business Continuity Plan and notify the BCP owner.",
            "Establish a temporary command post and communications with key stakeholders.",
            "Assess damage and prioritise recovery of critical business functions.",
            "Maintain external communications with clients, regulators, and insurers.",
        ],

        getDiscussionPrompts: () => [
            "How do you decide which business functions to restore first?",
            "What happens if your BCP document is stored only at the affected site?",
            "How would you manage staff welfare during an extended disruption?",
            "At what point do you activate your DR (Disaster Recovery) site?",
            "How would you communicate with customers if your primary communication systems are down?",
        ],

        getTimeline: (ctx) => [
            { index: 0,  title: "Disaster Warning Issued",           description: `Government issues a severe weather warning for {region}. {org}'s site is in the impact zone.`.replace(/\{region\}/g, ctx.region || "the region").replace(/\{org\}/g, ctx.org || ""), timeOffsetSec: 5 },
            { index: 1,  title: "BCP Owner Notified",                description: "The Business Continuity Plan owner convenes the crisis management team.", timeOffsetSec: 20 },
            { index: 2,  title: "Site Evacuation Ordered",           description: "Decision made to evacuate the primary site. Staff directed to assembly points.", timeOffsetSec: 50 },
            { index: 3,  title: "Primary Site Inaccessible",         description: "Flooding / structural damage renders the primary site inaccessible for an estimated 5 days.", timeOffsetSec: 90 },
            { index: 4,  title: "Damage Assessment",                 description: `{primaryAsset} assessed for damage. Servers on ground floor submerged.`.replace(/\{primaryAsset\}/g, ctx.primaryAsset || "IT infrastructure"), timeOffsetSec: 130 },
            { index: 5,  title: "DR Site Activation",               description: "Decision to activate the DR site. Remote access provisioned for critical staff.", timeOffsetSec: 170 },
            { index: 6,  title: "Client Communication",              description: "Key clients notified of service disruption. Estimated restoration timeline communicated.", timeOffsetSec: 210 },
            { index: 7,  title: "Temporary Command Post Established",description: `{teamSize} operating from alternate location. Communications restored via mobile and satellite.`.replace(/\{teamSize\}/g, ctx.teamSize || "The leadership team"), timeOffsetSec: 250 },
            { index: 8,  title: "Critical Function Restoration",     description: "Priority 1 business functions restored at DR site. Staff working remotely where possible.", timeOffsetSec: 310 },
            { index: 9,  title: "Regulatory Notification",          description: "Regulator notified of disruption as required under licence conditions.", timeOffsetSec: 360 },
            { index: 10, title: "Site Re-entry Assessment",          description: "Structural engineers clear portions of the site for limited re-entry.", timeOffsetSec: 430 },
            { index: 11, title: "Post-Event Review",                 description: "Full recovery achieved. BCP updated to address gaps identified during the event.", timeOffsetSec: 500 },
        ],

        getNodes: (ctx) => ({
            [nodeId(1)]: {
                title: "Disaster Imminent – Decision Required",
                situation: `A severe weather warning is in effect for {region}. {org}'s primary site is in the impact zone. Evacuation must happen within 2 hours.`.replace(/\{region\}/g, ctx.region || "").replace(/\{org\}/g, ctx.org || ""),
                question: "What is your first action?",
                options: [
                    { label: "A", text: "Notify all staff and begin orderly evacuation. Activate the BCP and notify the crisis management team.", outcome: { type: "node", target: nodeId(2) } },
                    { label: "B", text: "Wait to see if the warning is upgraded before disrupting operations.", outcome: { type: "failure" } },
                    { label: "C", text: "Evacuate IT staff only to protect equipment and allow other staff to continue working.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(2)]: {
                title: "Primary Site Inaccessible",
                situation: `The primary site has sustained significant damage. {primaryAsset} on the ground floor is unavailable. You need to decide how to maintain critical operations.`.replace(/\{primaryAsset\}/g, ctx.primaryAsset || "IT infrastructure"),
                question: "How do you maintain critical operations?",
                options: [
                    { label: "A", text: "Activate the DR site and provision remote access. Prioritise restoration of the top 3 critical business functions.", outcome: { type: "node", target: nodeId(3) } },
                    { label: "B", text: "Wait until the primary site is accessible before resuming any operations.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(3)]: {
                title: "Client Communication",
                situation: "Key clients are calling to ask about service continuity. Some contracts include SLA penalty clauses for extended outages.",
                question: "How do you handle client communications?",
                options: [
                    { label: "A", text: "Issue a proactive communication to all clients explaining the situation, expected timeline, and interim arrangements.", outcome: { type: "node", target: nodeId(4) } },
                    { label: "B", text: "Respond only to clients who contact you directly to avoid creating unnecessary alarm.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(4)]: {
                title: "Regulatory Notification",
                situation: "Your regulator requires notification of material disruptions within 24 hours. The disruption has now exceeded that threshold.",
                question: "What is your notification approach?",
                options: [
                    { label: "A", text: "Notify the regulator with a factual account of the event, current status, and estimated recovery timeline.", outcome: { type: "node", target: nodeId(5) } },
                    { label: "B", text: "Delay notification until recovery is complete to avoid regulatory scrutiny.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(5)]: {
                title: "Scenario Complete",
                situation: "Critical functions restored. Clients notified. Regulator informed. BCP updated with lessons learned from the event.",
                question: "Scenario complete. Well done!",
                options: [],
            },
        }),
    },

    // ── Supply Chain Compromise ───────────────────────────────────────────────
    supply_chain: {
        category: "Cyber",
        difficulty: "Advanced",
        tags: ["supply chain", "third-party risk", "software compromise", "APT"],
        getTitle: (ctx) => `Supply Chain Compromise – ${ctx.industry}`,
        getDescription: (ctx) =>
            `A trusted software vendor used by {org} has been compromised. Malicious code may have reached {primaryAsset}.`.replace(/\{org\}/g, ctx.org || "the organisation").replace(/\{primaryAsset\}/g, ctx.primaryAsset || "production systems"),

        getObjectives: () => [
            "Identify all instances of the compromised vendor software in the environment.",
            "Determine whether the malicious payload was executed in any environment.",
            "Isolate or patch affected systems in order of criticality.",
            "Assess the vendor's public disclosure and remediation timeline.",
            "Review and strengthen third-party software onboarding and patching processes.",
        ],

        getDiscussionPrompts: () => [
            "How do you verify whether a vendor's software update is legitimate or compromised?",
            "What contractual obligations does the vendor have to notify you of a breach?",
            "How would you prioritise which systems to investigate first across a large environment?",
            "What is your approach if the vendor denies the compromise or withholds technical details?",
            "How would you prevent a similar supply chain attack in the future?",
        ],

        getTimeline: (ctx) => [
            { index: 0,  title: "CERT Advisory Published",           description: "A national CERT publishes an advisory: a widely used IT management tool has been trojanised in recent updates.", timeOffsetSec: 5 },
            { index: 1,  title: "Vendor Software Identified",        description: `{primaryAsset} confirmed to run version 4.2.1 of the affected software, installed 3 weeks ago.`.replace(/\{primaryAsset\}/g, ctx.primaryAsset || "Production servers"), timeOffsetSec: 25 },
            { index: 2,  title: "Indicator of Compromise Review",    description: "IOCs from the CERT advisory cross-referenced with SIEM logs. Matching network beacon detected.", timeOffsetSec: 55 },
            { index: 3,  title: "Compromise Confirmed",              description: "Outbound connections to a known C2 domain confirmed on 2 servers. Malicious payload active.", timeOffsetSec: 90 },
            { index: 4,  title: "IR Team Mobilised",                 description: `{teamSize} assembled. Scope assessment underway across all environments.`.replace(/\{teamSize\}/g, ctx.teamSize || "IR team"), timeOffsetSec: 120 },
            { index: 5,  title: "Affected Systems Isolated",         description: "2 confirmed compromised servers isolated. Investigation of 14 additional potentially affected systems begun.", timeOffsetSec: 160 },
            { index: 6,  title: "Vendor Contact",                    description: "Vendor contacted. Patch available but IOC suggests dwell time of 3 weeks before detection.", timeOffsetSec: 210 },
            { index: 7,  title: "Lateral Movement Assessment",       description: "Forensic analysis underway to determine if the attacker moved laterally to other systems.", timeOffsetSec: 270 },
            { index: 8,  title: "Data Access Review",                description: "Attacker had read access to configuration data. No evidence of data exfiltration found to date.", timeOffsetSec: 330 },
            { index: 9,  title: "Patch and Rebuild",                 description: "Compromised servers rebuilt from known-good images. Vendor patch applied across the estate.", timeOffsetSec: 400 },
            { index: 10, title: "Threat Intelligence Shared",        description: "IOCs and findings shared with sector ISAC and national CERT to assist other organisations.", timeOffsetSec: 460 },
            { index: 11, title: "Third-Party Risk Review",           description: "All critical vendor software reviewed. New approval process for vendor updates implemented.", timeOffsetSec: 520 },
        ],

        getNodes: () => ({
            [nodeId(1)]: {
                title: "CERT Advisory – Compromised Software Detected",
                situation: "A CERT advisory identifies malicious code in a software update you installed 3 weeks ago. Network logs show a matching C2 beacon from 2 of your servers.",
                question: "What is your first action?",
                options: [
                    { label: "A", text: "Isolate the affected servers and begin forensic analysis to determine the scope of compromise.", outcome: { type: "node", target: nodeId(2) } },
                    { label: "B", text: "Apply the vendor patch immediately on all systems without isolating them first.", outcome: { type: "failure" } },
                    { label: "C", text: "Wait for official vendor guidance before taking any action that could disrupt services.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(2)]: {
                title: "Lateral Movement Risk",
                situation: "The compromised servers have had unrestricted network access for 3 weeks. There is a risk the attacker has moved laterally to other critical systems.",
                question: "How do you assess lateral movement?",
                options: [
                    { label: "A", text: "Review SIEM logs and network flow data for anomalous connections from the compromised servers to other internal systems.", outcome: { type: "node", target: nodeId(3) } },
                    { label: "B", text: "Assume no lateral movement and focus only on the 2 confirmed compromised servers.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(3)]: {
                title: "Data Exposure Assessment",
                situation: "Forensic evidence shows the attacker had read access to configuration and credential files for 3 weeks. The full scope of data accessed is unclear.",
                question: "How do you assess data exposure?",
                options: [
                    { label: "A", text: "Review file access logs, DLP alerts, and network egress for the 3-week dwell period to identify what data may have been exfiltrated.", outcome: { type: "node", target: nodeId(4) } },
                    { label: "B", text: "Treat the entire environment as compromised and rebuild all systems immediately.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(4)]: {
                title: "Notification and Intelligence Sharing",
                situation: "The investigation is complete. You have valuable IOCs and TTPs from this compromise. The sector ISAC is requesting member contributions.",
                question: "How do you handle notification and sharing?",
                options: [
                    { label: "A", text: "Share sanitised IOCs and TTPs with the sector ISAC and national CERT. Notify regulators and affected parties as required.", outcome: { type: "node", target: nodeId(5) } },
                    { label: "B", text: "Keep all findings confidential to protect the organisation's reputation.", outcome: { type: "failure" } },
                ],
            },
            [nodeId(5)]: {
                title: "Scenario Complete",
                situation: "Compromised systems rebuilt. Vendor patch applied. Third-party risk processes strengthened. Threat intelligence shared with the sector.",
                question: "Scenario complete. Well done!",
                options: [],
            },
        }),
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export const THREAT_TYPES = [
    { value: "ransomware",       label: "Ransomware" },
    { value: "phishing",         label: "Phishing / Business E-mail Compromise" },
    { value: "insider",          label: "Insider Threat / Data Exfiltration" },
    { value: "active_threat",    label: "Active Physical Threat" },
    { value: "natural_disaster", label: "Natural Disaster / Business Continuity" },
    { value: "supply_chain",     label: "Supply Chain Compromise" },
];

export const INDUSTRIES = [
    "Healthcare", "Finance", "Energy & Utilities", "Government", "Retail",
    "Education", "Technology", "Manufacturing", "Transportation", "Legal & Professional Services",
];

/**
 * Generates a complete scenario structure from an organisational profile.
 *
 * @param {object} profile - { threatType, industry, org, primaryAsset, secondaryAsset, teamSize, region }
 * @returns {object} Complete scenario definition ready for the scenario builder.
 */
export function generateScenario(profile) {
    const tpl = TEMPLATES[profile.threatType];
    if (!tpl) throw new Error(`Unknown threat type: ${profile.threatType}`);

    const ctx = {
        industry:       profile.industry       || "the industry",
        org:            profile.org            || "the organisation",
        primaryAsset:   profile.primaryAsset   || "critical systems",
        secondaryAsset: profile.secondaryAsset || "supporting infrastructure",
        teamSize:       profile.teamSize       || "the response team",
        region:         profile.region         || "the region",
    };

    const nodes   = tpl.getNodes(ctx);
    const nodeIds = Object.keys(nodes);

    // Assign sequential timeOffsetSec increments if missing (safety fallback).
    const timeline = tpl.getTimeline(ctx).map((item, i) => ({
        index:         i,
        title:         fill(item.title,       ctx),
        description:   fill(item.description, ctx),
        timeOffsetSec: item.timeOffsetSec ?? (i + 1) * 30,
    }));

    return {
        title:            tpl.getTitle(ctx),
        description:      fill(tpl.getDescription(ctx), ctx),
        category:         tpl.category,
        difficulty:       tpl.difficulty,
        tags:             tpl.tags,
        objectives:       tpl.getObjectives(),
        discussionPrompts: tpl.getDiscussionPrompts(),
        timeline,
        root:             nodeIds[0] || null,
        nodes,
    };
}
