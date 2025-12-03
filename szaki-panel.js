import { db, auth } from "./firebase.js";

import {
    doc, getDoc, updateDoc,
    collection, query, where,
    onSnapshot, setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ------------------------------------------------------
// SZAKI ADATAI
// ------------------------------------------------------
let uid = null;
let szakiData = null;
let activeChats = [];     // max 3
let blockedUsers = [];    // X-elt megrendelők

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    uid = user.uid;
    await loadSzaki();
    watchIncomingChats();
    setOnlineStatus(true);
});

// ------------------------------------------------------
// PROFIL BETÖLTÉSE
// ------------------------------------------------------
async function loadSzaki() {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    szakiData = snap.data();

    document.getElementById("nameBox").innerText = szakiData.name;
    document.getElementById("skillBox").innerText = szakiData.profession;
    document.getElementById("cityBox").innerText = szakiData.city;
    document.getElementById("onlineBox").innerText = "🟢 Online";

    activeChats = szakiData.activeChats || [];
    blockedUsers = szakiData.blockedUsers || [];

    renderActiveUsers();
}

// ------------------------------------------------------
// ONLINE ÁLLAPOT FIRESTORE-BE
// ------------------------------------------------------
async function setOnlineStatus(state) {
    await updateDoc(doc(db, "users", uid), {
        online: state,
        lastSeen: Date.now()
    });
}

// ------------------------------------------------------
// AKTÍV MEGRENDELŐK LISTÁJA
// ------------------------------------------------------
function renderActiveUsers() {
    const box = document.getElementById("activeUsers");
    box.innerHTML = "";

    if (activeChats.length === 0) {
        box.innerHTML = "<i>Nincs aktív megrendelő.</i>";
        return;
    }

    activeChats.forEach(userID => {
        box.innerHTML += `
            <div class="userItem">
                <b>${userID}</b><br>
                <button class="btn" onclick="openChat('${userID}')">
                    Chat megnyitása
                </button>
                <button class="removeBtn" onclick="removeUser('${userID}')">X</button>
            </div>
        `;
    });
}

// ------------------------------------------------------
// ÚJ MEGRENDELŐK FIGYELÉSE REALTIME
// ------------------------------------------------------
function watchIncomingChats() {
    const q = query(
        collection(db, "chats"),
        where("szakiID", "==", uid)
    );

    onSnapshot(q, snap => {
        const newBox = document.getElementById("newUsers");
        newBox.innerHTML = "";

        snap.forEach(docu => {
            const c = docu.data();

            if (!activeChats.includes(c.userID) &&
                !blockedUsers.includes(c.userID)) {

                newBox.innerHTML += `
                    <div class="userItem">
                        <b>${c.userName}</b><br>
                        <span class="small">Új megkeresés</span><br>
                        <button class="btn" onclick="acceptUser('${c.userID}')">
                            Elfogadás
                        </button>
                        <button class="removeBtn" onclick="rejectUser('${c.userID}')">X</button>
                    </div>
                `;
            }
        });
    });
}

// ------------------------------------------------------
// MEGRENDELŐ ELFOGADÁSA
// ------------------------------------------------------
window.acceptUser = async function(userID) {
    if (activeChats.length >= 3) {
        alert("Egyszerre maximum 3 megrendelővel beszélhetsz.");
        return;
    }

    activeChats.push(userID);

    await updateDoc(doc(db, "users", uid), {
        activeChats
    });

    renderActiveUsers();
};

// ------------------------------------------------------
// MEGRENDELŐ ELUTASÍTÁSA (X)
// ------------------------------------------------------
window.rejectUser = async function(userID) {
    if (!blockedUsers.includes(userID))
        blockedUsers.push(userID);

    await updateDoc(doc(db, "users", uid), {
        blockedUsers
    });

    alert("A megrendelő értesítve lett udvarias üzenettel.");

    renderActiveUsers();
};

// ------------------------------------------------------
// AKTÍV MEGRENDELŐ TÖRLÉSE (X)
// ------------------------------------------------------
window.removeUser = async function(userID) {
    activeChats = activeChats.filter(x => x !== userID);

    if (!blockedUsers.includes(userID))
        blockedUsers.push(userID);

    await updateDoc(doc(db, "users", uid), {
        activeChats,
        blockedUsers
    });

    renderActiveUsers();
};

// ------------------------------------------------------
// CHAT MEGNYITÁSA
// ------------------------------------------------------
window.openChat = function(userID) {
    window.location.href = `chat.html?partner=${userID}&role=szaki`;
};
