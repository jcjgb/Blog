var Tools = {
    /**
     * 过滤纯文本中的 a连接
     * @param data
     * @returns {XML|string|void}
     */
    autoLink : function (data) {
        var re = /((http|https|ftp):\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g;
        return (data.replace(re,'<a target="_blank" href="$1">$1</a>'));
    },
    /**
     * 生成动态不重复的一个16位的唯一标识
     * @returns {string}
     */
    guid : function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
    }
}

function getID(){
    return Tools.guid();
}