if (localStorage.savedNick) 
    document.getElementById("nick-area").value = localStorage.savedNick;
else
    localStorage.setItem('savedNick','');

if (!window.WebSocket) {
    document.body.innerHTML = 'WebSocket в этом браузере не поддерживается.';
}

// создать подключение
let sockPath = "ws://"+location.hostname+":8081/";
console.log(sockPath)
var socket = new WebSocket(sockPath)

// отправить сообщение из формы publish
document.forms.publish.addEventListener("submit", function (event) {
    event.preventDefault();    
    var outgoingMessage = this.message.value;
    let data = { type: 'chat-message', nick: this.nick.value, message: outgoingMessage };
    localStorage.setItem('savedNick',data.nick);
    let msg = JSON.stringify(data);
    document.getElementById("message-area").value = '';

    socket.send(msg);
});

let minMsgId = 999999999;
// обработчик входящих сообщений
socket.onmessage = function (event) {
    var incomingMessage = event.data;
    let data = JSON.parse(incomingMessage);

    minMsgId = Math.min(data.id,minMsgId);
    if (data.type == 'chat-message') showMessage(data);
    else if (data.type =='old-messages') 
    {
        console.error("This function is not yet implemented");
    }
};

function isAnyPartOfElementInViewport(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
    const windowWidth = (window.innerWidth || document.documentElement.clientWidth);

    const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
    const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);
    return (vertInView && horInView);
}
// показать сообщение в div#subscribe
function showMessage(data) 
{
    //let data = JSON.parse(message);
    let messageDiv = document.createElement("div");    
    let messageNickDiv = document.createElement("div");    
    let messageTextDiv = document.createElement("div");
    if (data.id && data.datetime)
    {
        let messageIdDiv = document.createElement("div");
        let messageDateTimeDiv = document.createElement("div");

        messageIdDiv.className = "message-id";
        messageDateTimeDiv.className = "message-datetime";
        messageIdDiv.innerHTML = data.id;
        messageDateTimeDiv.innerHTML = data.datetime;

        messageDiv.appendChild(messageIdDiv);
        messageDiv.appendChild(messageDateTimeDiv);
    }
    
    messageDiv.className = "message";
    messageNickDiv.className = "message-nick";
    messageTextDiv.className = "message-text";    
    messageNickDiv.innerHTML = data.nick;    
    messageTextDiv.innerHTML = data.message;
    
    messageDiv.appendChild(messageNickDiv);
    messageDiv.appendChild(messageTextDiv);    
    document.getElementById('subscribe').innerHTML = messageDiv.outerHTML + document.getElementById('subscribe').innerHTML; //prepend adds to the end for some reason, so using a workaround.
}

//Обработчик "бесконечного" скроллинга
setInterval(function() {
    let last = document.getElementById('subscribe').lastChild;
    if (isAnyPartOfElementInViewport(last))
    {
        let data = {
            type: 'load-more-messages',
            currentMinId: minMsgId
        }
        socket.send(JSON.stringify(data));
    }
}, 200);