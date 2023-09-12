package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"unicode/utf8"
	"unsafe"
)

func xml_search(data string, search_string string) (string, error) {
	start := strings.Index(data, "<"+search_string+">")
	if start == -1 {
		return "", fmt.Errorf("%s not found", search_string)
	}
	start += utf8.RuneCountInString(search_string) + 2
	end := strings.Index(data, "</"+search_string+">")
	if end == -1 {
		return "", fmt.Errorf("closing tag </%s> not found", search_string)
	}
	return data[start:end], nil
}

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
	url := "https://ext.nicovideo.jp/api/getthumbinfo/" + values["videoid"]
	resp, _ := http.Get(url)
	defer resp.Body.Close()
	byteArray, _ := io.ReadAll(resp.Body)
	xml_string := *(*string)(unsafe.Pointer(&byteArray))
	image_url, _ := xml_search(xml_string, "thumbnail_url")
	predict_long := 43 + 2*(utf8.RuneCountInString(values["videoid"])-2)
	if utf8.RuneCountInString(image_url) > predict_long {
		image_url += ".L"
	}
	var xml_videoid, _ = xml_search(xml_string, "video_id")
	var title, _ = xml_search(xml_string, "title")
	var description, _ = xml_search(xml_string, "description")
	var length, _ = xml_search(xml_string, "length")
	var view_count, _ = xml_search(xml_string, "view_counter")
	var comment_count, _ = xml_search(xml_string, "comment_num")
	var mylist_count, _ = xml_search(xml_string, "mylist_counter")
	var publish_time, _ = xml_search(xml_string, "first_retrieve")
	var embedable, _ = xml_search(xml_string, "embeddable")
	var genre, _ = xml_search(xml_string, "genre")
	ret_json_data := make(map[string]string)
	ret_json_data["video_id"] = xml_videoid
	ret_json_data["image"] = image_url
	ret_json_data["status"] = "success"
	ret_json_data["videoid"] = xml_videoid
	ret_json_data["title"] = title
	ret_json_data["description"] = description
	ret_json_data["length"] = length
	ret_json_data["view_count"] = view_count
	ret_json_data["comment_count"] = comment_count
	ret_json_data["mylist_count"] = mylist_count
	ret_json_data["publish_time"] = publish_time
	ret_json_data["embedable"] = embedable
	ret_json_data["genre"] = genre
	op, _ := json.MarshalIndent(ret_json_data, "", " ")
	fmt.Printf("Content-Type: application/json\n\n%s", op)
}
