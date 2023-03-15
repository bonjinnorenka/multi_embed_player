package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"unsafe"
)

func main() {
	queryString := os.Getenv("QUERY_STRING")
	// QUERY_STRINGをパースして、値を取得
	values := make(map[string]string)
	pairs := strings.Split(queryString, "&")
	for _, pair := range pairs {
		kv := strings.Split(pair, "=")
		if len(kv) == 2 {
			values[kv[0]] = kv[1]
		}
	}

	url := "https://api.bilibili.com/x/web-interface/view?bvid=" + values["bvid"]
	resp, _ := http.Get(url)
	defer resp.Body.Close()

	byteArray, _ := io.ReadAll(resp.Body)
	var tmp_json interface{}
	json.Unmarshal(byteArray, &tmp_json)
	if val, ok := values["image_base64"]; ok {
		if val == "1" {
			pic_url := tmp_json.(map[string]interface{})["data"].(map[string]interface{})["pic"].(string)
			resp, _ := http.Get(pic_url)
			defer resp.Body.Close()
			byteArray, _ := io.ReadAll(resp.Body)
			base64_image := base64.StdEncoding.EncodeToString(byteArray)
			tmp_json.(map[string]interface{})["image_base64"] = "data:image/jpeg;base64," + base64_image
		}
	}
	json_st, _ := json.MarshalIndent(tmp_json, "", " ") //書き出し
	fmt.Println("Content-Type: application/json\n\n")
	fmt.Println(*(*string)(unsafe.Pointer(&json_st)))
}
