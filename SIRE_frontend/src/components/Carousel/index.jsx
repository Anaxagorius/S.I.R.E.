/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Reusable carousel component used on the Home screen to display various simulated incident scenarios.
 */

import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "./Carousel.css";

import About from "../../assets/images/About.png";
import ActiveThreat from "../../assets/images/ActiveThreat.png";
import FireIncident from "../../assets/images/FireIncident.png";
import MedicalEmergency from "../../assets/images/MedicalEmergency.png";
import StructuralFailure from "../../assets/images/StructuralFailure.png";

/** Function that returns the HomeCarousel with rotating incident scenarios. */
export default function HomeCarousel() {
    return (
        <div className="carousel-padding-wrapper">
            <div className="carousel-wrapper">
                <Carousel
                    autoPlay
                    infiniteLoop
                    showThumbs={false}
                    showStatus={false}
                    showIndicators
                    interval={9500}
                    transitionTime={3500}
                    stopOnHover
                >
                    <div className="slide">
                        <img src={About} alt="About Slide" />
                        <div className="slide-overlay"></div>
                    </div>

                    <div className="slide">
                        <img src={FireIncident} alt="Fire Incident Slide" />
                        <div className="slide-overlay">
                            <h2>Fire Incident - Scenario</h2>
                            <p>A sudden fire breaks out, creating a fast-moving unpredictable situation. Responders must act quickly to assess hazards and protect lives.</p>
                        </div>
                    </div>

                    <div className="slide">
                        <img src={ActiveThreat} alt="Active Threat Slide" />
                        <div className="slide-overlay">
                            <h2>Active Threat - Scenario</h2>
                            <p>An active shooter or other immediate threat scenario requires rapid response and coordination to ensure safety and minimize harm.</p>
                        </div>
                    </div>

                    <div className="slide">
                        <img src={MedicalEmergency} alt="Medical Emergency Slide" />
                        <div className="slide-overlay">
                            <h2>Medical Emergency - Scenario</h2>
                            <p>A medical emergency requires immediate response and coordination to provide life-saving care and stabilize the patient.</p>
                        </div>
                    </div>

                    <div className="slide">
                        <img src={StructuralFailure} alt="Structural Failure Slide" />
                        <div className="slide-overlay">
                            <h2>Structural Failure - Scenario</h2>
                            <p>A structural failure requires immediate assessment and response to ensure safety and prevent further damage.</p>
                        </div>
                    </div>
                </Carousel>
            </div>
        </div>
    );
}
