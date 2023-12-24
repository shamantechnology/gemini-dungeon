import { useEffect, useState, useRef } from "react";
import AIDMPP from "./dm_ai.png";
import LOADINGIF from './loading.gif';
import {
    Container,
    Row,
    Col
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'

function App() {
    let [chatHistory, setChatHistory] = useState([]);
    let [viewPNG, setViewPNG] = useState(<img src={LOADINGIF} className="loading-gif" alt="loading..." />);
    const init_called = useRef();
    const chatbox = useRef("");

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

    const chatboxScrollDown = () => {
        if(chatbox && chatbox.current) {
            console.log("csd: ", chatbox.current.scrollTop);
            console.log("csd: ", chatbox.current.scrollHeight);
            chatbox.current.scrollTop = chatbox.current.scrollHeight;
        }
    }

    // handle user chat message submit
    // add message, send to api and get response
    const handleSubmit = async (evt) => {
        evt.preventDefault();
        let usermsg_ta = document.getElementById("user-msg-content");
        let usermsg = usermsg_ta.value;

        if (usermsg !== "") {
            usermsg_ta.value = "";

            addMsg(usermsg, "user");
            addMsg("", "ai_processing");

            // scroll down - have to wait on DOM
            setTimeout(chatboxScrollDown, 100);

            evt.target.setAttribute("disabled", true);
        
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
                    const ddnow = new Date();
                    setViewPNG(
                        <img 
                            className="ai-view"
                            src={`data:image/png;base64,${respJSON["vision"]}`}
                            alt={`AI vision @ ${ddnow.toLocaleString()}`}
                        />
                    );
                } else {
                    addMsg(respJSON["ai"], "ai")
                    console.error("llm error: ", respJSON["error"])
                }

                // scroll down - have to wait on DOM
                setTimeout(chatboxScrollDown, 100);

                // remove disable on send button
                evt.target.removeAttribute("disabled");
            } catch (error) {
                console.error("rag error: ", error);
            }
        }

        

    }

    const start_dm = async () => {
        if (init_called.current) {
            return;
        }
        
        if (chatHistory.length === 0) {
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
                    },
                    redirect: "follow", // manual, *follow, error
                    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                });

                let respJSON = await resp.json();
                if (respJSON["error"] === "") {
                    addMsg(respJSON["ai"], "ai");
                    const ddnow = new Date();
                    setViewPNG(
                        <img
                            className="ai-view"
                            src={`data:image/png;base64,${respJSON["vision"]}`}
                            alt={`AI vision @ ${ddnow.toLocaleString()}`}
                        />
                    );
                } else {
                    addMsg(respJSON["ai"], "ai")
                    console.error("llm error: ", respJSON["error"])
                }

                // scroll down - have to wait on DOM
                setTimeout(chatboxScrollDown, 100);

                init_called.current = false;
            } catch (error) {
                console.error("rag error: ", error);
            }
        }
    }

    useEffect(() => {
        

        start_dm();

        // set auto scroll
        // window.setInterval(function () {
        //     let chatbox = document.getElementById("chatbox");
        //     chatbox.scrollTop = chatbox.scrollHeight;
        // }, 10000);

        // add submit on enter
        // document.getElementById("user-msg-content").addEventListener("keydown", async (evt) => {
        //     if (evt.key === "Enter" && !evt.shiftKey) {
        //         evt.preventDefault();
        //         await handleSubmit(evt);
        //     }
        // });

    }, []);

    return (
        <Container fluid={true}>
            <Row>
                <Col xs={12} sm={6} md={6} lg={6} className="dungeon-view">
                    {viewPNG}
                </Col>
                <Col xs={12} sm={6} md={6} lg={6} className="chatbox-container">
                    <div id="chatbox" ref={chatbox}>
                        {chatHistory}
                    </div>
                    <div className="chat-input">
                        <textarea className="form-control form-control-lg input-textarea" id="user-msg-content" placeholder="Type message"></textarea>
                        <button id="submit-msg" onClick={handleSubmit} className="btn btn-lg btn-primary">
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default App;
