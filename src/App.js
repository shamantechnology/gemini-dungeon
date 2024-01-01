import { useEffect, useState } from "react";
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
    let [viewPNG, setViewPNG] = useState(<img src={LOADINGIF} className="loading-gif" />);
    let init_called = false;

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

    // handle user chat message submit
    // add message, send to api and get response
    const handleSubmit = async (evt) => {
        evt.preventDefault();
        // autoscroll down chatbox
        let chatbox = document.getElementById("chatbox");
        let usermsg_ta = document.getElementById("user-msg-content");
        let usermsg = usermsg_ta.value;

        if (usermsg !== "") {
            usermsg_ta.value = "";

            addMsg(usermsg, "user");
            addMsg("", "ai_processing");

            evt.target.setAttribute("disabled", true);
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
                        <img className="ai-view" src={`data:image/png;base64,${respJSON["vision"]}`} />
                    );
                } else {
                    addMsg(respJSON["ai"], "ai")
                    console.error("llm error: ", respJSON["error"])
                }

                // remove disable on send button
                evt.target.removeAttribute("disabled");
                chatbox.scrollTop = chatbox.scrollHeight;
            } catch (error) {
                console.error("rag error: ", error);
            }
        }

    }

    useEffect(() => {


        const start_dm = async (init_called) => {
            if (chatHistory.length == 0 && init_called === false) {
                init_called = true;
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
                            <img className="ai-view" src={`data:image/png;base64,${respJSON["vision"]}`} />
                        );
                    } else {
                        addMsg(respJSON["ai"], "ai")
                        console.error("llm error: ", respJSON["error"])
                    }
                } catch (error) {
                    console.error("rag error: ", error);
                }
            }

            return init_called;
        }

        init_called = start_dm(init_called);

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
                    <div id="chatbox">
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
