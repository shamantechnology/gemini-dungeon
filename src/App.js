import { useEffect, useState, useRef } from "react";
import { useParams } from 'react-router-dom'
import AIDMPP from "./dm_ai.png";
// import MAPBG from "./mapbg.png";
import {
    Container,
    Row,
    Col, 
    Button,
    Modal,
    ModalBody,
    ModalFooter
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

    // capture sessionid passed from user
    const { userSessionID } = useParams();

    const [introModal, setIntroModal] = useState(true);
    const [chatHistory, setChatHistory] = useState([]);
    const [viewPNG, setViewPNG] = useState(loading_dots);
    const [playerStats, setPlayerStats] = useState({});
    // let [sessionId, setSessionId] = useState("");

    let chatboxRef = useRef(null);
    // let mapCanvasRef = useRef(null);
    let initCalled = useRef(false);
    let userSubmit = useRef(false); // checks if user submitted a message or not

    // modal window functions
    const imToggle = () => setIntroModal(!introModal);

    // api urls
    const dmStartURL = process.env.REACT_APP_GD_API_URL + "/dmstart";
    const runURL = process.env.REACT_APP_GD_API_URL + "/run";

    // const post data
    const post_data = {
        method: "POST", 
        mode: "cors", 
        cache: "no-cache", 
        credentials: "same-origin", 
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        redirect: "follow",
        referrerPolicy: "no-referrer", 
    };

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
        let statsOrder = ["Name", "Class", "Level", "Hit_Points", "Race", "Gender", "Alignment", "Description", "Background",
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
                try {
                    post_data.body = JSON.stringify({
                        "usermsg": usermsg,
                        "session_id": localStorage.getItem("gdmsess")
                    });

                    let resp = await fetch(runURL, post_data);

                    let respJSON = await resp.json();

                    let aityping = document.getElementById("ai-typing");
                    aityping.remove();

                    if (respJSON["error"] === "") {
                        addMsg(respJSON["ai"], "ai");
                        setViewPNG(
                            <img className="ai-view" src={`data:image/png;base64,${respJSON["vision"]}`} alt="AI Vision" />
                        );
                    } else {
                        if (respJSON["ai"] !== ""){
                            addMsg(respJSON["ai"], "ai")
                        } else {
                            addMsg("I'm sorry I do not understand. Can you restate your message again?", "ai")
                        }
                        
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
            console.log("userSessionID\n", userSessionID)
            if (chatHistory.length === 0 && initCalled.current === false) {
                initCalled.current = true;

                // disable submit button
                let submitBtn = document.getElementById("submit-msg");
                submitBtn.setAttribute("disabled", true);

                // get player stat to show with data
                let playerstat_dom = document.getElementById("pstats");

                // call gemini dungeon endpoint via post
                let apiURL;
                if (userSessionID === undefined) {
                    apiURL = dmStartURL;
                } else {
                    apiURL = runURL;
                    post_data.body = JSON.stringify({
                        "usermsg": "I have reloaded my game save. Please continue from the last message",
                        "session_id": userSessionID
                    });
                }
                
                try {
                    let resp = await fetch(apiURL, post_data);

                    let respJSON = await resp.json();
                    if(resp.status === 400) {
                        console.log(respJSON["error"], respJSON["type"]);
                        if(respJSON["type"] === 0) {
                            window.location.href = "/";
                        }
                    }

                    if (respJSON["error"] === "") {
                        addMsg(respJSON["ai"], "ai");
                        setViewPNG(
                            <img className="ai-view" src={`data:image/png;base64,${respJSON["vision"]}`} alt="AI ViSion" />
                        );
                    } else {
                        addMsg(respJSON["ai"], "ai");
                        console.error("llm error: ", respJSON["error"]);
                    }

                    // player stats
                    setPlayerStats(respJSON["player_stats"]);

                    // set sessions id
                    localStorage.setItem("gdmsess", respJSON["session_id"]);

                    userSubmit.current = false;

                    // disable submit button
                    submitBtn.removeAttribute("disabled");

                    // show player stats
                    playerstat_dom.style.display = "inherit";
                } catch (error) {
                    console.error("rag error: ", error);
                }
            } else if(userSessionID !== undefined) {

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
            <Modal isOpen={introModal} toggle={imToggle}>
                <ModalBody>
                    <span className="gd-modal-title">
                        <h2>Welcome To</h2>
                        <h1><u>Gemini Dungeon</u></h1>
                    </span>
                    <p>A text and image based AI Dungeon Master game</p>
                    <p class="gms-text"><b>Will you survive?</b></p>
                    <p><b>News and Updates</b> <i>Updated 02/22/24</i></p>
                    <ul>
                        <li>Working on faster game loading, please give it 5 seconds or so to load (APIs moving internally)</li>
                        <li>Currently working on being able to add your own character</li>
                        <li>Item and stat management still in the works, right now stats are static</li>
                        <li>Working on user login and saving games. Please see <a href="https://x.com/ShamanTeKLLC/status/1760189001024012572?s=20" target="_blank" rel="noreferrer">here</a> on how to load old games back manually</li>
                    </ul>
                    <p><b>Bugs?</b></p>
                    <p>Please report bugs to <a href="mailto:contact@burningpixel.net" target="_blank" rel="noreferrer">contact@burningpixel.net</a> or DM <a href="https://x.com/ShamanTeKLLC/" target="_blank" rel="noreferrer">@ShamanTekLLC</a> on X</p>
                    <p><b>Support</b></p>
                    <p>Your support is welcomed and appreciated. If you enjoy this project please follow <a href="https://x.com/ShamanTeKLLC/" target="_blank" rel="noreferrer">@ShamanTekLLC</a> on X to keep updated.</p>
                    <p>🍵 <a href="https://ko-fi.com/geminidungeon" target="_blank" rel="noreferrer">Buy me a kofi</a> 🍵</p>
                </ModalBody>
                <ModalFooter>
                <Button color="primary" onClick={imToggle}>
                    Play
                </Button>
                </ModalFooter>
            </Modal>
            <Row className="view-row">
                <Col xl={9} lg={9} md={12} sm={12} xs={12} className="dungeon-view">
                    {viewPNG}
                </Col>
                <Col xl={3} lg={3} className="game-info d-none d-sm-block d-sm-none d-md-block d-md-none d-lg-block">
                    <div className="player-stats" id="pstats">
                        <div class="seContainer">
                            <input type="text" readOnly value={localStorage.getItem("gdmsess")} title="Session ID" />
                        </div>
                        
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
