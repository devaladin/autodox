import { AuthClient } from "@dfinity/auth-client";
import { createActor, canisterId, idlFactory } from './../../../../../src/declarations/backend';

const { ic } = window;
const { plug } = ic;

let backendActor, loading = false

export const get_actor = async () => {
    await new Promise(resolve => !loading && resolve());
    console.log('get_actor')
    loading = true

    if (!backendActor) {
        if (process.env.USE_WALLET) {
            try {
                if (!(await is_logged())) {
                    await plug.requestConnect({
                        whitelist: [process.env.BACKEND_CANISTER_ID],
                        host: process.env.DFX_NETWORK === "ic" ? 'https://mainnet.dfinity.network' : 'http://localhost:8510',
                        timeout: 50000,
                        onConnectionUpdate: () => {
                            console.log('sessionData: ', plug.sessionManager.sessionData)
                        },
                    });
                }
            } catch (e) {
                console.log(e)
                return
            }

            backendActor = await plug.createActor({ canisterId, interfaceFactory: idlFactory, agent: plug.agent });
        } else {
            const authClient = await AuthClient.create();
            const identity = await authClient.getIdentity();
            backendActor = createActor(canisterId, {
                agentOptions: {
                    identity,
                    host: window.location.href,
                }
            });
        }
    }

    loading = false
    return backendActor;
}

export async function identify() {
    const authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
        return authClient.getIdentity();
    }
    let identityProvider = "https://identity.ic0.app/#authorize";
    if (process.env.DFX_NETWORK != "ic") {
        identityProvider = `http://${process.env.IDENTITY_PROVIDER_ID}.localhost:8510/#authorize`
    }
    return await authClient.login({
        identityProvider,
        onSuccess: () => {
            window.location.reload()
        }
    });
}

export async function is_logged() {
    const authClient = await AuthClient.create();
    return await authClient.isAuthenticated()
}

export async function logout() {
    const authClient = await AuthClient.create();
    await authClient.logout()
}

export async function get_profile() {
    const actor = await get_actor()
    let result = await actor.get_profile();
    result = result[0];
    if (typeof (result.username) == "object") {
        result.username = result.username[0] || "";
    }
    if (typeof (result.image) == "object") {
        result.image = result.image[0] || "";
    }
    return result;
}

export async function get_directories() {
    let actor = await get_actor()
    let result = await actor.get_directories();
    console.log('ic_agent#get_directories: result: ', result)
    result = result[0];
    if (result) {
        for (let i = 0; i < result.files.vertices.length; i++) {
            result.files.vertices[i][1].element_tree = result.files.vertices[i][1].element_tree[0];
        }
        result.files.root = result.files.root[0];
    }
    return result;
}

export async function register(username) {
    const backend = await get_actor()
    return await backend.register(username);
}

/* Common Call */

const isObject = data => {
    return Object.prototype.toString.call(data) === '[object Object]'
}

const isOption = data => {
    const res = !!(Array.isArray(data) && data.length <= 1)
    return res
}

const getNoOption = (data) => {
    if (isOption(data)) {
        return getNoOption(data[0])
    }
    if (!isObject(data)) {
        return data
    }
    const noOption = {}
    Object.keys(data).forEach(key => {
        noOption[key] = getNoOption(data[key])
    })
    return noOption
}

export async function call_ic_raw(method, stringify) {
    let actor = await get_actor();
    let res = await actor[method](stringify)
    return res;
}

export async function call_ic(method, stringify) {
    console.log('call_ic: ', method)
    let res = await call_ic_raw(method, stringify);
    const noOption = getNoOption(res)
    return noOption;
}

export async function call_ic_np_raw(method) { // np: no parameter
    let actor = await get_actor();
    let res = await actor[method]()
    return res;
}

export async function call_ic_np(method) { // np: no parameter
    let res = await call_ic_np_raw(method);
    const noOption = getNoOption(res)
    return noOption;
}
