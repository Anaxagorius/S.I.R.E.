/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-23
 * Description: Trainee interface screen for interacting with scenario-based decision nodes.
 * Displays the current scenario, question, and selectable options.
 */

import { useState } from "react";
import TraineeInterfaceLayout from "../../layouts/TraineeInterfaceLayout";
import scenarioData from "../../data/scenario.json";

/** Function that returns the TraineeInterface component. */
export default function TraineeInterface() {

    /** Constant for tracking current node state. */
    const [currentNodeId, setCurrentNodeId] = useState(scenarioData.root);

    /** Constant for tracking session time (NOTE: placeholder). */
    const [time] = useState("00:00");

    /** Constant for retrieving the current node from the scenario JSON. */
    const currentNode = scenarioData.nodes[currentNodeId];

    /** Function that handles option selection. */
    function handleOptionClick(option) {
        const outcome = option.outcome;
        if (outcome.type === "node") {
            setCurrentNodeId(outcome.target);
        } else if (outcome.type === "failure") {
            alert("Scenario failed!");
            // TODO: handle failure state properly
        }
    }

    return (
        <TraineeInterfaceLayout time={time}>

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
    )
}
