/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-25
 * Description: Trainee interface screen for interacting with scenario-based decision nodes.
 * Dynamically loads the scenario from the backend based on the session's scenario key.
 * Displays the current scenario, question, and selectable options.
 * Receives live timeline events from the backend via Socket.IO.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import TraineeInterfaceLayout from "../../layouts/TraineeInterfaceLayout";
import apiClient from "../../services/api/apiClient";
import { SOCKET_URL, SOCKET_API_KEY } from "../../services/socketConfig";

/** Function that returns the TraineeInterface component. */
export default function TraineeInterface() {

    const location = useLocation();

    /** Session code and scenario key passed via navigation state. */
    const sessionCode = location.state?.sessionCode || null;
    const scenarioKey = location.state?.scenarioKey || null;

    /** Scenario data loaded from the backend. */
    const [scenarioData, setScenarioData] = useState(null);
    const [loadError, setLoadError] = useState(scenarioKey ? null : "No scenario selected. Please join a session first.");

    /** Constant for tracking current node state. */
    const [currentNodeId, setCurrentNodeId] = useState(null);

    /** Constant for tracking session time (NOTE: placeholder). */
    const [time] = useState("00:00");

    /** Live timeline events injected by the admin during the session. */
    const [timelineEvents, setTimelineEvents] = useState([]);

    /** Ref to persist the socket across renders. */
    const socketRef = useRef(null);

    /** Load scenario data from backend and connect to socket. */
    useEffect(() => {
        if (!scenarioKey) return;

        async function loadScenario() {
            try {
                const data = await apiClient.get(`/scenarios/${scenarioKey}`);
                if (!data.root || !data.nodes) {
                    setLoadError("Scenario data is incomplete. Please contact the administrator.");
                    return;
                }
                setScenarioData(data);
                setCurrentNodeId(data.root);
            } catch (err) {
                console.error("Failed to load scenario:", err);
                setLoadError("Failed to load scenario. Please contact the administrator.");
            }
        }

        loadScenario();

        if (!sessionCode) return;

        /** Connect to Socket.IO /sim namespace as a trainee. */
        const socket = io(`${SOCKET_URL}/sim`, {
            auth: SOCKET_API_KEY ? { apiKey: SOCKET_API_KEY } : {},
            transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("session:join", { sessionCode, displayName: "Trainee" });
        });

        socket.on("timeline:tick", (payload) => {
            setTimelineEvents((prev) => [
                ...prev,
                { title: payload.title, description: payload.description, time: new Date().toLocaleTimeString() },
            ]);
        });

        return () => {
            socket.disconnect();
        };
    }, [scenarioKey, sessionCode]);

    /** Function that handles option selection. */
    function handleOptionClick(option) {
        const outcome = option.outcome;
        if (outcome.type === "node") {
            setCurrentNodeId(outcome.target);
        } else if (outcome.type === "failure") {
            alert("Incorrect action — scenario failed. Review the correct procedures and try again.");
        }
    }

    /** Show error state if scenario couldn't be loaded. */
    if (loadError) {
        return (
            <TraineeInterfaceLayout time={time}>
                <div className="scenario-card">
                    <h2>Unable to Load Scenario</h2>
                    <p>{loadError}</p>
                </div>
            </TraineeInterfaceLayout>
        );
    }

    /** Show loading state while scenario data is being fetched. */
    if (!scenarioData || !currentNodeId) {
        return (
            <TraineeInterfaceLayout time={time}>
                <div className="scenario-card">
                    <h2>Loading Scenario...</h2>
                    <p>Please wait while the scenario is being loaded.</p>
                </div>
            </TraineeInterfaceLayout>
        );
    }

    const currentNode = scenarioData.nodes[currentNodeId];

    return (
        <TraineeInterfaceLayout time={time}>

            {/** Live timeline events from the admin. */}
            {timelineEvents.length > 0 && (
                <div className="scenario-card">
                    <h3>Live Updates</h3>
                    {timelineEvents.map((evt, i) => (
                        <p key={i}><strong>[{evt.time}] {evt.title}:</strong> {evt.description}</p>
                    ))}
                </div>
            )}

            {/** Scenario content. */}
            <div className="scenario-card">
                <h2>{currentNode.title}</h2>
                <p>{currentNode.situation}</p>
                <hr />
                <p><strong>{currentNode.question}</strong></p>
            </div>

            {/** Options rendered as clickable cards. */}
            <div className="options-container">
                {currentNode.options.map((option, index) => (
                    <div
                        key={index}
                        className="option-card"
                        onClick={() => handleOptionClick(option)}
                    >
                        <div className="option-label">{option.label}</div>
                        <div className="option-text">{option.text}</div>
                    </div>
                ))}
            </div>

        </TraineeInterfaceLayout>
    );
}
