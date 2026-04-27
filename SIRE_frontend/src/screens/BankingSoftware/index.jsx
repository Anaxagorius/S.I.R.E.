/**
 * Author: Leon Wasiliew
 * Last Update: 2026-04-27
 * Description: Banking Software simulation hub.
 * Lists the banking software tools used by the organisation and surfaces
 * all relevant tabletop simulations grouped by software platform.
 * Admins can launch a session directly from any simulation card.
 */

import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "../../layouts/AdminDashboardLayout";
import BackButton from "../../components/BackButton";

/** Banking software platforms and their linked simulations. */
const BANKING_SOFTWARE = [
    {
        name: "Mambu",
        icon: "🏦",
        description: "Cloud-based core banking platform used for loan management, account processing, and GL operations.",
        simulations: [
            {
                id: "scenario_bank_mambu_login_failure",
                name: "Mambu SSO Login Failure",
                icon: "🔐",
                description: "An expired SAML certificate breaks the Azure AD SSO integration with Mambu, blocking all staff at branch opening.",
                difficulty: "Intermediate",
            },
            {
                id: "scenario_bank_mambu_transaction_error",
                name: "Mambu Transaction Posting Error",
                icon: "💳",
                description: "Tellers across multiple branches cannot post loan repayments — a missing GL account mapping causes every transaction to fail.",
                difficulty: "Intermediate",
            },
            {
                id: "scenario_bank_mambu_integration_failure",
                name: "Mambu Credit Bureau Integration Failure",
                icon: "🔗",
                description: "Mambu's webhook integration with the credit scoring engine stops returning decisions after an API key expires.",
                difficulty: "Intermediate",
            },
        ],
    },
    {
        name: "Core Banking System",
        icon: "🏛️",
        description: "Enterprise core banking infrastructure underpinning all branch transactions, ATM networks, and internet banking.",
        simulations: [
            {
                id: "scenario_bank_core_banking_outage",
                name: "Core Banking System Outage",
                icon: "⚠️",
                description: "The core banking system becomes unresponsive mid-morning — branches invoke BCP manual fallback while IT resolves the root cause.",
                difficulty: "Advanced",
            },
        ],
    },
    {
        name: "Internet Banking Portal",
        icon: "🌐",
        description: "Customer-facing online banking platform for account access, transfers, and loan management.",
        simulations: [
            {
                id: "scenario_bank_internet_banking_down",
                name: "Internet Banking Portal Outage",
                icon: "🚫",
                description: "A faulty software deployment causes the internet banking portal to return 500 errors while social media complaints mount.",
                difficulty: "Intermediate",
            },
        ],
    },
    {
        name: "ATM Network",
        icon: "🏧",
        description: "Regional ATM hardware and HSM key management infrastructure for cardholder PIN verification and cash dispensing.",
        simulations: [
            {
                id: "scenario_bank_atm_software_fault",
                name: "ATM HSM Key Management Failure",
                icon: "🔑",
                description: "A failed zone master key rotation takes 23 ATMs offline — restoring them requires a dual-control key ceremony under PCI DSS.",
                difficulty: "Advanced",
            },
        ],
    },
    {
        name: "Know Your Member (KYM)",
        icon: "🪪",
        description: "Member identity verification and KYC compliance platform used during account opening and regulatory audits.",
        simulations: [],
    },
    {
        name: "Doxim ECM",
        icon: "📄",
        description: "Enterprise content management system for storing, managing, and retrieving member documents and loan files.",
        simulations: [],
    },
    {
        name: "ASAPP Online",
        icon: "💬",
        description: "AI-powered customer engagement and contact centre automation platform.",
        simulations: [],
    },
    {
        name: "Coconut Software",
        icon: "🥥",
        description: "Appointment scheduling and virtual branch management platform for members and staff.",
        simulations: [],
    },
    {
        name: "Kudos",
        icon: "🌟",
        description: "Employee recognition and engagement platform used across the organisation.",
        simulations: [],
    },
    {
        name: "Square 9",
        icon: "📁",
        description: "Intelligent document processing and workflow automation platform.",
        simulations: [],
    },
    {
        name: "ClickSwitch",
        icon: "🔄",
        description: "Automated account switching service for new members transferring direct deposits and recurring payments.",
        simulations: [],
    },
    {
        name: "Collabria",
        icon: "💳",
        description: "Credit card program management and processing platform.",
        simulations: [],
    },
    {
        name: "MyCO-OP",
        icon: "🤝",
        description: "Cooperative banking network providing shared branching, ATM, and payment services.",
        simulations: [],
    },
    {
        name: "CUZone",
        icon: "🖥️",
        description: "Member self-service portal for online account management and secure messaging.",
        simulations: [],
    },
    {
        name: "DataWatch",
        icon: "📊",
        description: "Data analytics and process intelligence platform for operational reporting and compliance monitoring.",
        simulations: [],
    },
    {
        name: "CGI Information Query",
        icon: "🔍",
        description: "CGI banking information and query system used for regulatory reporting and data retrieval.",
        simulations: [],
    },
    {
        name: "Branch Printers",
        icon: "🖨️",
        description: "Network-attached printers at branch locations used for transaction receipts, loan documents, and member correspondence.",
        simulations: [
            {
                id: "scenario_bank_printer_offline",
                name: "Bank Branch Printer Offline",
                icon: "🖨️",
                description: "A network printer at a bank branch goes offline during peak hours, preventing tellers from printing receipts and loan documents.",
                difficulty: "Beginner",
            },
            {
                id: "scenario_bank_printer_add_configure",
                name: "Adding a Printer at a Bank Branch",
                icon: "🖨️",
                description: "IT deploys, configures, and securely installs a new network printer at a bank branch — covering static IP, AD access controls, and secure print PIN.",
                difficulty: "Intermediate",
            },
        ],
    },
];

/** Returns the CSS class name for a difficulty badge. */
function difficultyClass(difficulty) {
    if (difficulty === "Beginner") return "difficulty-beginner";
    if (difficulty === "Intermediate") return "difficulty-intermediate";
    if (difficulty === "Advanced") return "difficulty-advanced";
    return "";
}

/** Function that returns the BankingSoftware component for the banking simulation hub. */
export default function BankingSoftware() {

    const navigate = useNavigate();

    /** Navigate to AdminDashboard and pre-select a banking scenario for session creation. */
    function handleLaunchScenario(scenarioId) {
        navigate("/admin-dashboard", { state: { preSelectScenario: scenarioId } });
    }

    const softwareWithSims = BANKING_SOFTWARE.filter(s => s.simulations.length > 0);
    const softwareWithoutSims = BANKING_SOFTWARE.filter(s => s.simulations.length === 0);

    return (
        <AdminDashboardLayout>

            {/** Back navigation. */}
            <BackButton to="/admin" />

            {/** Header card. */}
            <div className="dashboard-card">
                <h2>🏦 Banking Software Simulations</h2>
                <p>
                    Tabletop exercises and incident simulations for the banking software platforms used across the organisation.
                    Select a scenario to launch a facilitated training session.
                </p>
            </div>

            {/** Software platforms with simulations. */}
            {softwareWithSims.map((software) => (
                <div key={software.name} className="dashboard-card">
                    <h3>{software.icon} {software.name}</h3>
                    <p style={{ opacity: 0.75, fontSize: "0.9rem", marginBottom: "1rem" }}>{software.description}</p>
                    <div className="scenario-grid">
                        {software.simulations.map((sim) => (
                            <button
                                key={sim.id}
                                className="scenario-card"
                                onClick={() => handleLaunchScenario(sim.id)}
                            >
                                <span className="scenario-card-icon">{sim.icon}</span>
                                <span className="scenario-card-name">{sim.name}</span>
                                <span className="scenario-card-desc">{sim.description}</span>
                                {sim.difficulty && (
                                    <span className={`scenario-card-difficulty ${difficultyClass(sim.difficulty)}`}>
                                        {sim.difficulty}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {/** Software platforms without simulations yet. */}
            <div className="dashboard-card">
                <h3>📋 Other Banking Software</h3>
                <p style={{ opacity: 0.75, fontSize: "0.9rem", marginBottom: "1rem" }}>
                    The following platforms are used by the organisation. Simulations for these systems can be created in the{" "}
                    <a
                        href="/scenario-builder"
                        style={{ color: "var(--color-accent)", textDecoration: "underline" }}
                        onClick={(e) => { e.preventDefault(); navigate("/scenario-builder"); }}
                    >
                        Scenario Builder
                    </a>.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {softwareWithoutSims.map((software) => (
                        <span
                            key={software.name}
                            title={software.description}
                            style={{
                                background: "var(--color-surface)",
                                border: "1px solid var(--color-border-mid)",
                                borderRadius: "6px",
                                padding: "0.4rem 0.75rem",
                                fontSize: "0.85rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                            }}
                        >
                            {software.icon} {software.name}
                        </span>
                    ))}
                </div>
            </div>

            {/** Quick link to see all Banking scenarios in the session launcher. */}
            <div className="dashboard-card" style={{ textAlign: "center" }}>
                <p style={{ marginBottom: "0.75rem", opacity: 0.8 }}>
                    View all banking scenarios in the full session launcher with filtering options.
                </p>
                <button
                    className="btn"
                    onClick={() => navigate("/admin-dashboard", { state: { filterCategory: "Banking" } })}
                >
                    Open Session Launcher → Banking Filter
                </button>
            </div>

        </AdminDashboardLayout>
    );
}
