use crate::backend::call_surreal;
use uuid::Uuid;
use shared::schema::{EditorElementUpdate, ElementTree};
use yewdux::prelude::Dispatch;
use crate::utils::DeviceInfo;

pub async fn update_element(data: EditorElementUpdate) -> Result<(), String> {
    let info = Dispatch::<DeviceInfo>::new();
    if info.get().web || info.get().online {
        unimplemented!();
    }
    if !info.get().web {
        return call_surreal(
            "update_element".to_string(),
            Some(&serde_json::json!({ "data": data })),
        )
        .await;
    } else {
        // user is offline throw a error
        return Err("user is offline".to_string());
    }
}

pub async fn get_element_tree(id : &Uuid) -> Result<ElementTree, String> {
    let info = Dispatch::<DeviceInfo>::new();
    if info.get().web || info.get().online {
        unimplemented!();
    }
    if !info.get().web {
        return call_surreal(
            "get_element_tree".to_string(),
            Some(&serde_json::json!({"id" : id})),
        )
        .await;
    } else {
        // user is offline throw a error
        return Err("user is offline".to_string());
    }
}

pub async fn create_element_tree(data : &ElementTree, file_id : Uuid) -> Result<(), String> {
    let info = Dispatch::<DeviceInfo>::new();
    if info.get().web || info.get().online {
        unimplemented!();
    }
    if !info.get().web {
        return call_surreal(
            "create_element_tree".to_string(),
            Some(&serde_json::json!({ "data": data , "fileId" : file_id})),
        )
        .await;
    } else {
        // user is offline throw a error
        return Err("user is offline".to_string());
    }
}
