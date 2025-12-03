import { db, auth, storage } from "./firebase.js";

import {
    doc, getDoc, addDoc, updateDoc,
    collection, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ------------------------------------------------------
// URL PARAMS
// ------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const chatID = params.get("chatID");
const partnerID = params.get("partner");
let uid = null;
let me = null;
let partner = null;

// ------------------------------------------------------
// BELÉPÉS ELLENŐRZÉS
// ------------------------------------------------------
onAuthStateChanged(auth, async user => {
    if (!user) return window.location.href = "login.html";
    uid = user.uid;

    me = (await getDoc(doc(db, "users", uid))).data();
    partner = (await getDoc(doc(db, "users", partnerID))).data();

    document.getElementById("partnerName").innerText =
        partner.name || partner.email;

    document.getElementById("partnerStatus").innerText =
        partner.online ? "🟢" : "⚪";

    if ((me.shareCount || 0) < 5)
        document.getElementById("lockWarning").style.display = "block";

    loadMessages();
});

// ------------------------------------------------------
// ÜZENET LISTA
// ------------------------------------------------------
function loadMessages() {
    const box = document.getElementById("messages");
    box.innerHTML = "Betöltés...";

    const q = query(
        collection(db, "chats", chatID, "messages"),
        orderBy("timestamp", "asc")
    );

    onSnapshot(q, snap => {
        box.innerHTML = "";
        snap.forEach(d => {
            const m = d.data();
            const div = document.createElement("div");
            div.className = "msg " + (m.sender === uid ? "me" : "other");

            if (m.type === "img") {
                div.innerHTML = `<img src="${m.url}" style="max-width:200px; border-radius:8px;">`;
            } else {
                div.innerText = m.text;
            }

            box.appendChild(div);
        });

        box.scrollTop = box.scrollHeight;
    });
}

// ------------------------------------------------------
// KÜLDÉS
// ------------------------------------------------------
document.getElementById("sendBtn").onclick = sendMsg;

document.getElementById("msgInput").addEventListener("keypress", e => {
    if (e.key === "Enter") sendMsg();
});

async function sendMsg() {
    const text = msgInput.value.trim();
    if (!text) return;

    if ((me.shareCount || 0) < 5 && looksLikeContact(text)) {
        lockWarning.style.display = "block";
        return;
    }

    await addDoc(collection(db, "chats", chatID, "messages"), {
        sender: uid,
        text,
        type: "text",
        timestamp: Date.now()
    });

    msgInput.value = "";
}

// ------------------------------------------------------
// TELEFONSZÁM / EMAIL TILTÁS
// ------------------------------------------------------
function looksLikeContact(t) {
    return /[0-9]{6,}/.test(t) || t.includes("@") || t.includes(".hu");
}

// ------------------------------------------------------
// KÉPKÜLDÉS
// ------------------------------------------------------
imgBtn.onclick = () => imgPicker.click();

imgPicker.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const path = `chat_images/${chatID}/${Date.now()}.jpg`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "chats", chatID, "messages"), {
        sender: uid,
        type: "img",
        url,
        timestamp: Date.now()
    });
};

// ------------------------------------------------------
// DIKTÁLÁS GOMB (WEB SPEECH API)
// ------------------------------------------------------
micBtn.onclick = () => {
    const rec = new webkitSpeechRecognition();
    rec.lang = "hu-HU";
    rec.start();

    rec.onresult = e => {
        msgInput.value = msgInput.value + " " + e.results[0][0].transcript;
    };
};

// ------------------------------------------------------
// GÉPELÉS JELZÉS
// ------------------------------------------------------
msgInput.addEventListener("input", () => {
    updateDoc(doc(db, "chats", chatID), {
        typing: uid
    });
});

onSnapshot(doc(db, "chats", chatID), snap => {
    const d = snap.data();
    typing.innerText =
        d.typing && d.typing !== uid ? "Gépel…" : "";
});
