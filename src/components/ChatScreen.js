import styled from "styled-components";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { useRouter } from "next/router";
import { Avatar, IconButton } from "@material-ui/core";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import AttachFileicon from '@material-ui/icons/AttachFile';
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon';
import MicIcon from '@material-ui/icons/Mic';
import { useCollection } from 'react-firebase-hooks/firestore';
import Message from "./Message";
import { useRef, useState } from "react";
import firebase from 'firebase';
import getRecipientEmail from "../utils/getRecipientEmail";
import Timeago from 'timeago-react';
import * as timeago from 'timeago.js';

import pt_BR from 'timeago.js/lib/lang/pt_BR'
timeago.register('pt_BR', pt_BR);

function ChatScreen({ chat, messages }) {
    const [user] = useAuthState(auth);
    const [input, setInput] = useState("");
    const endOfMessageRef = useRef(null);
    const router = useRouter();
    const [messagesSnapshot] = useCollection(
        db
            .collection("chats")
            .doc(router.query.id)
            .collection("messages")
            .orderBy("timestamp", "asc")

    );

    const [recipientSnapshot] = useCollection(
        db
            .collection("users")
            .where("email", "==", getRecipientEmail(chat.users, user))
    );

    const showMessages = () => {
        if (messagesSnapshot) {
            return messagesSnapshot.docs.map((message) => (
                <Message
                    key={message.id}
                    user={message.data().user}
                    message={{
                        ...message.data(),
                        timestamp: message.data().timestamp?.toDate().getTime()
                    }}
                />
            ));
        } else {
            return JSON.parse(messages).map((message) => (
                <Message
                    key={message.id}
                    user={message.user}
                    message={message}
                />
            ));
        }
    }

    const scrollToBottom = () => {
        endOfMessageRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
        })
    }

    const sendMessage = (e) => {
        e.preventDefault();

        // ATUALIZA ULTIMA VISUALIZAÇÃO
        db.collection("users").doc(user.uid).set({
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        },
            { merge: true }
        );

        db.collection("chats").doc(router.query.id).collection("messages").add({
            message: input,
            user: user.email,
            photoURL: user.photoURL,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        setInput('');
        scrollToBottom();
    }

    const recipient = recipientSnapshot?.docs?.[0]?.data();
    const recipientEmail = getRecipientEmail(chat.users, user);

    return (
        <Container>
            <Header>
                {recipient ? (
                    <Avatar src={recipient?.photoURL} />
                ) : (
                    <Avatar>{recipientEmail[0]}</Avatar>
                )}
                <HeaderInformation>
                    <h3>{recipientEmail.slice(0, 30) + (recipientEmail.length > 30 ? "..." : "")}</h3>
                    {recipientSnapshot ? (
                        <p>Visualizado a: {' '}
                            {recipient?.lastSeen?.toDate() ? (
                                <Timeago datetime={recipient?.lastSeen?.toDate()} locale='pt_BR' />
                            ) : "Unavailable"}

                        </p>
                    ) : (
                        <p>Loading Last active</p>
                    )}

                </HeaderInformation>
                <HeaderIcons>
                    <IconButton>
                        <AttachFileicon />
                    </IconButton>
                    <IconButton>
                        <MoreVertIcon />
                    </IconButton>
                </HeaderIcons>
            </Header>

            <MessageContainer>
                {showMessages()}<br /><br /><br />
                <EndOfMessage ref={endOfMessageRef} />
            </MessageContainer>

            <InputContainer>
                <IconButton>
                    <InsertEmoticonIcon />
                </IconButton>
                <Input value={input} onChange={e => setInput(e.target.value)} />
                <button hidden disabled={!input} type="submit" onClick={sendMessage}>Send Message</button>
                <IconButton>
                    <MicIcon />
                </IconButton>
            </InputContainer>
        </Container>
    )
}

export default ChatScreen

const Container = styled.div``;

const Input = styled.input`
    flex: 1;
    outline: 0;
    border:none;
    border-radius: 10px;
    background-color: whitesmoke;
    padding: 20px;
    margin-left: 15px;
    margin-right: 15px;
`;

const InputContainer = styled.form`
    display: flex;
    align-items: center;
    padding: 10px;
    position: sticky;
    bottom: 0;
    background-color: white;
    z-index: 100;
`;

const Header = styled.div`
    position: sticky;
    background-color: white;
    z-index: 100;
    top: 0;
    display:flex;
    height: 80px;
    align-items: center;
    border-bottom: 1px solid whitesmoke;
    width: 100%;
`;

const HeaderInformation = styled.div`
    margin-left: 15px;
    flex:1;

    > h3 {
        margin-bottom: 3px;
    }

    >p {
        font-size: 14px;
        color: gray;
    }
`;

const HeaderIcons = styled.div``;

const MessageContainer = styled.div`
    padding: 30px;
    background-color: #e5ded8;
    min-height: 90vh;
`;

const EndOfMessage = styled.div``;