import axios from 'axios';

const API = axios.create({
    baseURL:'http://localhost:5000',
})

//Add token to request headers
//this function runs before every request is sent, allowing us to attach the token to the headers of each request automatically.
API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");//retrieves token from browser's local storage
    if(token){
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

//Auth API
export const signUp = (formData) => API.post('/auth/signup', formData);
export const signIn = (formData) => API.post('/auth/signin', formData);

//Room Api
export const createRoom =() => API.post("/rooms/create");
export const joinRoom = (roomId) => API.post(`/rooms/join/${roomId}`);
export const validateRoom = (roomId) => API.get(`/rooms/${roomId}`);
export const leaveRoom = (roomId) => API.post(`/rooms/leave/${roomId}`);