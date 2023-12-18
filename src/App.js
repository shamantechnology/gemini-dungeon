import { useEffect, useState } from "react";
import AIDMPP from "./dm_ai.png";
import {
    Container,
    Row,
    Col
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'

function App() {
    let [chatHistory, setChatHistory] = useState([]);

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

        console.log(new_msg_dom);
        setChatHistory(context => [...context, new_msg_dom]);
    }

    // handle user chat message submit
    // add message, send to api and get response
    const handleSubmit = async (evt) => {
        evt.preventDefault();
        let usermsg_ta = document.getElementById("user-msg-content");
        let usermsg = usermsg_ta.value;

        addMsg(usermsg, "user");
        addMsg("", "ai_processing");

        evt.target.setAttribute("disabled", true);

        // call rag endpoint via post
        let ragURL = process.env.NEXT_PUBLIC_MCAI_API_URL + "/rag";
        console.log(ragURL);

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
                body: JSON.stringify({
                    "usermsg": usermsg
                }), // body data type must match "Content-Type" header
            });

            let respJSON = await resp.json();

            let aityping = document.getElementById("ai-typing");
            aityping.remove();
            addMsg(respJSON["ai"], "ai");
            //evt.target.setAttribute("disabled", false);
            evt.target.removeAttribute("disabled");
        } catch (error) {
            console.error("rag error: ", error);
        }
    }

    useEffect(() => {
        setChatHistory([(
            <div className="ai-chat-container" key={0}>
                <div className="profile-picture">
                    <img
                        src={AIDMPP}
                        className="ai-avatar"
                        alt="ai avatar"
                    />
                </div>
                <div className="message">
                    <p>
                        Hello Adventurer!
                        <br />
                        Welcome to the Gemini Maze
                    </p>
                </div>
            </div>
        )]);
    }, []);

    return (
        <Container fluid={true}>
            <Row>
                <Col xs={6} className="dungeon-view">
                    <img src="maze_idea.png" />
                </Col>
                <Col xs={6} className="chatbox-container">
                    <div id="chatbox">
                        {chatHistory}
                    </div>
                    <div class="chat-input">
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
