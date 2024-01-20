import { useEffect, useState, useRef } from "react";
import AIDMPP from "./dm_ai.png";
// import MAPBG from "./mapbg.png";
import {
    Container,
    Row,
    Col
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'

function App() {
    let loading_dots = (
        <div className="lds-grid">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    );

    let [chatHistory, setChatHistory] = useState([]);
    let [viewPNG, setViewPNG] = useState(loading_dots);
    let [playerStats, setPlayerStats] = useState({});
    let chatboxRef = useRef(null);
    // let mapCanvasRef = useRef(null);
    let initCalled = useRef(false);
    let userSubmit = useRef(false); // checks if user submitted a message or not

    // add message to chat
    const addMsg = (content, type) => {
        let new_msg_dom;
        let next_key = chatHistory.length;

        if (type === "user") {
            next_key = next_key.toString() + "a";
            new_msg_dom = (
                <div className="user-chat-container chat-entry" key={next_key}>
                    <div className="message">
                        <p>{content}</p>
                    </div>
                </div>
            );
        } else if (type === "ai") {
            next_key = next_key.toString() + "b";
            new_msg_dom = (
                <div className="ai-chat-container chat-entry" key={next_key}>
                    <div className="profile-picture">
                        <img
                            src={AIDMPP}
                            className="ai-avatar"
                            alt="ai avatar"
                        />
                    </div>
                    <div className="message">
                        <p>{content}</p>
                    </div>
                </div>
            );
        } else if (type === "ai_processing") {
            next_key = next_key.toString() + "c";
            new_msg_dom = (
                <div className="typing chat-entry" id="ai-typing" key={next_key}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            );
        }

        setChatHistory(context => [...context, new_msg_dom]);
    }

    // display_player_stats
    // create dom for player stats display
    const display_player_stats = (stats) => {
        let psDOM = [];

        // Set the stat display order array
        let statsOrder = ["Name", "Class", "Level", "Hit_Points", "Race", "Alignment", "Description", "Background",
            "Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];

        // Iterate through statsOrder to ensure order
        for (let i = 0; i < statsOrder.length; i++) {
            const key = statsOrder[i].toLowerCase();
            psDOM.push((
                <li key={i}>
                    <i>{statsOrder[i]}</i>&nbsp;&nbsp;<b>&nbsp;&nbsp;{stats[key]}</b>
                </li>
            ));
        }

        return psDOM
    }

    // handle user chat message submit
    // add message, send to api and get response
    const handleSubmit = async (evt) => {
        evt.preventDefault();

        if(userSubmit.current === false) {
            let submitBtn = document.getElementById("submit-msg");
            let chatbox = document.getElementById("chatbox");
            let usermsg_ta = document.getElementById("user-msg-content");
            let usermsg = usermsg_ta.value;

            if (usermsg !== "") {
                usermsg_ta.value = "";

                addMsg(usermsg, "user");
                addMsg("", "ai_processing");

                // disable submit button
                submitBtn.setAttribute("disabled", true);
                userSubmit.current = true;

                // autoscroll chat
                chatbox.scrollTop = chatbox.scrollHeight;

                // call gemini dungeon endpoint via post
                let ragURL = process.env.REACT_APP_GD_API_URL + "/run";

                try {
                    let resp = await fetch(ragURL, {
                        method: "POST", // *GET, POST, PUT, DELETE, etc.
                        mode: "cors", // no-cors, *cors, same-origin
                        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
                        credentials: "same-origin", // include, *same-origin, omit
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        },
                        redirect: "follow", // manual, *follow, error
                        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                        body: JSON.stringify({
                            "usermsg": usermsg
                        }), // body data type must match "Content-Type" header
                    });

                    let respJSON = await resp.json();

                    let aityping = document.getElementById("ai-typing");
                    aityping.remove();

                    if (respJSON["error"] === "") {
                        addMsg(respJSON["ai"], "ai");
                        setViewPNG(
                            <img className="ai-view" src={`data:image/png;base64,${respJSON["vision"]}`} alt="AI Vision" />
                        );
                    } else {
                        addMsg(respJSON["ai"], "ai")
                        console.error("llm error: ", respJSON["error"])
                    }

                    // remove disable on send button
                    submitBtn.removeAttribute("disabled");
                    userSubmit.current = false;

                    // autoscroll chat
                    chatbox.scrollTop = chatbox.scrollHeight;
                } catch (error) {
                    console.error("rag error: ", error);
                }
            }
        }
    }

    const handleSubmitOnEnter = (evt) => {
        if(userSubmit.current === false) {
            if (evt.key === "Enter" && !evt.shiftKey) {
                handleSubmit(evt);
            }
        }
    }

    useEffect(() => {
        const start_dm = async () => {
            userSubmit.current = true;
            if (chatHistory.length === 0 && initCalled.current === false) {
                initCalled.current = true;

                // disable submit button
                let submitBtn = document.getElementById("submit-msg");
                submitBtn.setAttribute("disabled", true);

                // call gemini dungeon endpoint via post

                let ragURL = process.env.REACT_APP_GD_API_URL + "/dmstart";
                try {
                    let resp = await fetch(ragURL, {
                        method: "POST", // *GET, POST, PUT, DELETE, etc.
                        mode: "cors", // no-cors, *cors, same-origin
                        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
                        credentials: "same-origin", // include, *same-origin, omit
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        },
                        redirect: "follow", // manual, *follow, error
                        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                    });

                    let respJSON = await resp.json();
                    if (respJSON["error"] === "") {
                        addMsg(respJSON["ai"], "ai");
                        setViewPNG(
                            <img className="ai-view" src={`data:image/png;base64,${respJSON["vision"]}`} alt="AI ViSion" />
                        );
                    } else {
                        addMsg(respJSON["ai"], "ai")
                        console.error("llm error: ", respJSON["error"])
                    }

                    // player stats
                    setPlayerStats(respJSON["player_stats"]);

                    // disable submit button
                    submitBtn.removeAttribute("disabled");
                } catch (error) {
                    console.error("rag error: ", error);
                }
            }
        }

        start_dm();

        // add enter submit
        document.getElementById("user-msg-content").addEventListener("keydown", handleSubmitOnEnter);

    }, []);

    useEffect(() => {
        chatboxRef.current.scrollIntoView(false);
        chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }, [chatHistory]);

    return (
        <Container fluid={true}>
            <Row className="view-row">
                <Col xl={9} lg={9} md={12} sm={12} xs={12} className="dungeon-view">
                    {viewPNG}
                </Col>
                <Col xl={3} lg={3} className="game-info d-none d-sm-block d-sm-none d-md-block d-md-none d-lg-block">
                    <div className="player-stats">
                        <h2>Your Stats</h2>
                        <ul>
                            {display_player_stats(playerStats)}
                        </ul>
                    </div>
                </Col>
            </Row>
            <Row className="chat-row">
                <Col xs={12} className="chatbox-container">
                    <div id="chatbox" ref={chatboxRef}>
                        {chatHistory}
                    </div>
                    <div className="chat-input">
                        <textarea className="form-control form-control-lg" id="user-msg-content" placeholder="Type message"></textarea>
                        <button id="submit-msg" onClick={handleSubmit} className="btn btn-lg btn-dark">
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    </div>
                </Col>
                {/* <Col xs={12} className="term-container">
                    <div class="term">
                        <div class="chat-container" id="chatbox">
                            <div class="ai-resp">
                                <p>
                                    Hello, what is your name?
                                </p>
                            </div>
                            <div class="user-resp">
                                <p>
                                    John
                                </p>
                            </div>
                            <div class="loading"></div>
                        </div>

                        <div class="input-container">
                            <textarea class="user-input" id="usermsg"></textarea>
                        </div>
                    </div>
                </Col> */}
            </Row>
        </Container>
    );
}

export default App;
