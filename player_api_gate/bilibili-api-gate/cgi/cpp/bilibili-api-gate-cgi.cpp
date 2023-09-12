#include "curl/curl.h"
#include "json.hpp"
#include <iostream>
#include <string>
#include <unordered_map>

using json = nlohmann::json;

struct MemoryStructAdvance {
    char *memory;
    size_t size;
    size_t reserved_size;
    void free_memory(){
        delete this->memory;
        this->memory = NULL;
    }
};

static size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp){
    MemoryStructAdvance *msp = (MemoryStructAdvance *)userp;
    size_t realsize = size * nmemb;
    bool memory_reserve_size_changed = false;
    while(realsize+msp->size > msp->reserved_size){//メモリを拡大
        memory_reserve_size_changed = true;
        if(msp->reserved_size<=0){
            msp->reserved_size = 1000;
        }
        msp->reserved_size = msp->reserved_size*2;
    }
    char* data_input_char;
    if(memory_reserve_size_changed){
        data_input_char = new char[msp->reserved_size];
        memset(data_input_char,'\0',msp->reserved_size);
        memcpy(data_input_char,msp->memory,msp->size);
        delete msp->memory;
        msp->memory = data_input_char;
    }
    else{
        data_input_char = msp->memory;
    }
    memcpy(data_input_char+msp->size,contents,realsize);
    msp->size += realsize;
    return realsize;
}
MemoryStructAdvance downloadFileOnMemory(std::string url,std::vector<std::string> header={},std::string cookieFilePath="",std::string useragent=""){
    CURL *curl_handle;
    CURLcode res;
    MemoryStructAdvance ms;
    ms.reserved_size = 1000;
    ms.size = 0;
    ms.memory = new char[ms.reserved_size];
    memset(ms.memory,'\0',ms.reserved_size);
    curl_handle = curl_easy_init();
    //オレオレ証明書対応
    curl_easy_setopt(curl_handle, CURLOPT_SSL_VERIFYPEER,0); //証明書の確認をしない

    curl_easy_setopt(curl_handle, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl_handle, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
    curl_easy_setopt(curl_handle, CURLOPT_WRITEDATA, (void *)&ms);
    if(useragent==(std::string)""){
        curl_easy_setopt(curl_handle, CURLOPT_USERAGENT, "libcurl-agent/1.0");
    }
    else{
        curl_easy_setopt(curl_handle, CURLOPT_USERAGENT, useragent.c_str());
    }
    curl_easy_setopt(curl_handle, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(curl_handle, CURLOPT_MAXREDIRS, 10);
    curl_easy_setopt(curl_handle, CURLOPT_NOSIGNAL, 1L);
    
    if(cookieFilePath!=(std::string)""){
        curl_easy_setopt(curl_handle, CURLOPT_COOKIEFILE, cookieFilePath.c_str());
    }
    if(header.size()!=0){
        struct curl_slist *chunk = NULL;
        for(int x=0;x<header.size();x++){
            chunk = curl_slist_append(chunk, header[x].c_str());
        }
        curl_easy_setopt(curl_handle, CURLOPT_HTTPHEADER, chunk);
    }
    res = curl_easy_perform(curl_handle);
    if(res != CURLE_OK) {
        fprintf(stderr, "curl_easy_perform() failed: %s\n",curl_easy_strerror(res));
    }
    curl_easy_cleanup(curl_handle);
    return ms;
}

void return_data(json jsondata){
    //std::cout << "Content-Type: application/json\nAccess-Control-Allow-Origin: *\ncache-control: max-age=2592000\n\n" << jsondata.dump() << std::endl;
    std::cout << "Content-Type: application/json\n\n";
    std::cout << jsondata.dump() << std::endl;
}

typedef enum tagBASE64_TYPE {
    BASE64_TYPE_STANDARD,
    BASE64_TYPE_MIME,
    BASE64_TYPE_URL
} BASE64_TYPE;

static const char BASE64_TABLE[] = {
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
};
static const char BASE64_TABLE_URL[] = {
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
};
static const int BASE64_TABLE_LENGTH = {
    sizeof(BASE64_TABLE) / sizeof(BASE64_TABLE[0]) - 1
};

typedef struct tagBASE64_SPEC {
    BASE64_TYPE type;
    const char *table;
    char pad;
    int maxLineLength;
    char *lineSep;
    int lineSepLength;
} BASE64_SPEC;
static const BASE64_SPEC BASE64_SPECS[] = {
    { BASE64_TYPE_STANDARD, BASE64_TABLE,     '=', 0,  NULL,   0 },
    { BASE64_TYPE_MIME,     BASE64_TABLE,     '=', 76, "\r\n", 2 },
    { BASE64_TYPE_URL,      BASE64_TABLE_URL, 0,   0,  NULL,   0 }
};
static const size_t BASE64_SPECS_LENGTH = {
    sizeof(BASE64_SPECS) / sizeof(BASE64_SPECS[0])
};

char *base64Encode(const char *data, const size_t size, const BASE64_TYPE type)
{
    BASE64_SPEC spec;
    size_t length;
    char *base64;
    char *cursor;
    int lineLength;
    int i;
    int j;

    if (data == NULL) {
        return NULL;
    }

    spec = BASE64_SPECS[0];
    for (i = 0; i < (int)BASE64_SPECS_LENGTH; i++) {
        if (BASE64_SPECS[i].type == type) {
            spec = BASE64_SPECS[i];
            break;
        }
    }

    length = size * 4 / 3 + 3 + 1;
    if (spec.maxLineLength > 0) {
        length += size / spec.maxLineLength * spec.lineSepLength;
    }
    //base64 = (char*)malloc(length);
    base64 = new char[length];
    if (base64 == NULL) {
        return NULL;
    }

    cursor = base64;
    lineLength = 0;
    for (i = 0, j = size; j > 0; i += 3, j -= 3) {
        if (spec.maxLineLength > 0) {
            if (lineLength >= spec.maxLineLength) {
                char *sep;

                for (sep = spec.lineSep; *sep != 0; sep++) {
                    *(cursor++) = *sep;
                }
                lineLength = 0;
            }
            lineLength += 4;
        }

        if (j == 1) {
            *(cursor++) = spec.table[(data[i + 0] >> 2 & 0x3f)];
            *(cursor++) = spec.table[(data[i + 0] << 4 & 0x30)];
            *(cursor++) = spec.pad;
            *(cursor++) = spec.pad;
        }
        else if (j == 2) {
            *(cursor++) = spec.table[(data[i + 0] >> 2 & 0x3f)];
            *(cursor++) = spec.table[(data[i + 0] << 4 & 0x30) | (data[i + 1] >> 4 & 0x0f)];
            *(cursor++) = spec.table[(data[i + 1] << 2 & 0x3c)];
            *(cursor++) = spec.pad;
        }
        else {
            *(cursor++) = spec.table[(data[i + 0] >> 2 & 0x3f)];
            *(cursor++) = spec.table[(data[i + 0] << 4 & 0x30) | (data[i + 1] >> 4 & 0x0f)];
            *(cursor++) = spec.table[(data[i + 1] << 2 & 0x3c) | (data[i + 2] >> 6 & 0x03)];
            *(cursor++) = spec.table[(data[i + 2] << 0 & 0x3f)];
        }
    }
    *cursor = 0;

    return base64;
}

int main(){
    json ret_js;
    try{
        const char* query_string = std::getenv("QUERY_STRING");
        std::string query_string_str = query_string ? query_string : "";
        if(query_string_str==""){
            query_string_str = "bvid=BV1Yq4y1Z785&image_base64=1";
        }

        // QUERY_STRINGをパースしてunordered_mapに格納する
        std::unordered_map<std::string, std::string> params;
        size_t pos = 0;
        while (pos < query_string_str.size()) {
            size_t end_pos = query_string_str.find('&', pos);
            if (end_pos == std::string::npos) {
                end_pos = query_string_str.size();
            }
            size_t sep_pos = query_string_str.find('=', pos);
            if (sep_pos == std::string::npos || sep_pos > end_pos) {
                sep_pos = end_pos;
            }
            std::string key = query_string_str.substr(pos, sep_pos - pos);
            std::string value = "";
            if (sep_pos < end_pos) {
                value = query_string_str.substr(sep_pos + 1, end_pos - sep_pos - 1);
            }
            params[key] = value;
            pos = end_pos + 1;
        }
        delete query_string;
        if(params.count("bvid")!=1){//bvidが見つからないとき
            ret_js["status"] = "failed";
            ret_js["message"] = "plese set bvid in query string example ?bvid=BV1Yq4y1Z785";
            ret_js["product_type"] = "bilibili api";
            return_data(ret_js);
        }
        else{
            std::string api_url = "https://api.bilibili.com/x/web-interface/view?bvid=" + params["bvid"];
            //char* api_res_char = downloadFileOnMemory(api_url);
            MemoryStructAdvance tmp_ms;
            try{
                tmp_ms = downloadFileOnMemory(api_url);
            }
            catch(...){
                ret_js["status"] = "failed";
                ret_js["message"] = "network access error";
                ret_js["product_type"] = "bilibili api";
                return_data(ret_js);
            }
            char* api_res_char = tmp_ms.memory;
            std::string api_res_string = strdup(api_res_char);
            delete api_res_char;
            api_res_char = NULL;
            //tmp_ms.free_memory();
            ret_js = json::parse(api_res_string);
            if(params.count("image_base64")==1&&params["image_base64"]=="1"){
                std::string image_url = ret_js["data"]["pic"];
                MemoryStructAdvance image_res_data_ms;
                try{
                    image_res_data_ms = downloadFileOnMemory(image_url);
                }
                catch(...){
                    ret_js["status"] = "failed";
                    ret_js["message"] = "network access error";
                    ret_js["product_type"] = "bilibili api";
                    return_data(ret_js);
                }
                char* image_base64_char = base64Encode(image_res_data_ms.memory,image_res_data_ms.size,BASE64_TYPE_STANDARD);
                std::string image_base64_string = image_base64_char;
                ret_js["image_base64"] = "data:image/jpeg;base64," + image_base64_string;
                delete image_base64_char;
                image_base64_char = NULL;
                image_res_data_ms.free_memory();
            }
            return_data(ret_js);
        }
    }
    catch(...){
        ret_js["status"] = "failed";
        ret_js["message"] = "internal server error";
        ret_js["product_type"] = "bilibili api";
        return_data(ret_js);
    }
}
