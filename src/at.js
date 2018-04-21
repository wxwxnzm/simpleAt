"use strict";
var InputCaret, Mirror, Utils, methods, oDocument, oFrame, oWindow, pluginName;

pluginName = 'caret';


InputCaret = (function() {
    function InputCaret($inputor) {
        this.$inputor = $inputor;
        this.domInputor = this.$inputor;
    }

    InputCaret.prototype.getIEPos = function() {
        var endRange, inputor, len, normalizedValue, pos, range, textInputRange;
        inputor = this.domInputor;
        range = oDocument.selection.createRange();
        pos = 0;
        if (range && range.parentElement() === inputor) {
            normalizedValue = inputor.value.replace(/\r\n/g, "\n");
            len = normalizedValue.length;
            textInputRange = inputor.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());
            endRange = inputor.createTextRange();
            endRange.collapse(false);
            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                pos = len;
            } else {
                pos = -textInputRange.moveStart("character", -len);
            }
        }
        return pos;
    };

    InputCaret.prototype.getPos = function() {
        if (oDocument.selection) {
            return this.getIEPos();
        } else {
            return this.domInputor.selectionStart;
        }
    };

    InputCaret.prototype.setPos = function(pos) {
        var inputor, range;
        inputor = this.domInputor;
        if (oDocument.selection) {
            range = inputor.createTextRange();
            range.move("character", pos);
            range.select();
        } else if (inputor.setSelectionRange) {
            inputor.setSelectionRange(pos, pos);
        }
        return inputor;
    };

    InputCaret.prototype.getIEOffset = function(pos) {
        var h, textRange, x, y;
        textRange = this.domInputor.createTextRange();
        pos || (pos = this.getPos());
        textRange.move('character', pos);
        x = textRange.boundingLeft;
        y = textRange.boundingTop;
        h = textRange.boundingHeight;
        return {
            left: x,
            top: y,
            height: h
        };
    };

    InputCaret.prototype.getOffset = function(pos) {
        var $inputor, offset, position;
        $inputor = this.$inputor;
        if (oDocument.selection) {
            offset = this.getIEOffset(pos);
            offset.top += $(oWindow).scrollTop() + $inputor.scrollTop();
            offset.left += $(oWindow).scrollLeft() + $inputor.scrollLeft();
            return offset;
        } else {
            offset = $inputor.offset();
            position = this.getPosition(pos);
            return offset = {
                left: offset.left + position.left - $inputor.scrollLeft(),
                top: offset.top + position.top - $inputor.scrollTop(),
                height: position.height
            };
        }
    };

    InputCaret.prototype.getPosition = function(pos) {
        var $inputor, at_rect, end_range, format, html, mirror, start_range;
        $inputor = this.$inputor;
        format = function(value) {
            value = value.replace(/<|>|`|"|&/g, '?').replace(/\r\n|\r|\n/g, "<br/>");
            if (/firefox/i.test(navigator.userAgent)) {
                value = value.replace(/\s/g, '&nbsp;');
            }
            return value;
        };
        if (pos === void 0) {
            pos = this.getPos();
        }
        start_range = $inputor.value.slice(0, pos); // 原生value
        end_range = $inputor.value.slice(pos); // 原生value
        html = "<span style='position: relative; display: inline;'>" + format(start_range) + "</span>";
        html += "<span id='caret' style='position: relative; display: inline;'>|</span>";
        html += "<span style='position: relative; display: inline;'>" + format(end_range) + "</span>";
        mirror = new Mirror($inputor);
        return at_rect = mirror.create(html).rect();
    };

    InputCaret.prototype.getIEPosition = function(pos) {
        var h, inputorOffset, offset, x, y;
        offset = this.getIEOffset(pos);
        inputorOffset = this.$inputor.offset();
        x = offset.left - inputorOffset.left;
        y = offset.top - inputorOffset.top;
        h = offset.height;
        return {
            left: x,
            top: y,
            height: h
        };
    };

    return InputCaret;

})();

Mirror = (function() {
    Mirror.prototype.css_attr = ["borderBottomWidth", "borderLeftWidth", "borderRightWidth", "borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle", "borderTopWidth", "boxSizing", "fontFamily", "fontSize", "fontWeight", "height", "letterSpacing", "lineHeight", "marginBottom", "marginLeft", "marginRight", "marginTop", "outlineWidth", "overflow", "overflowX", "overflowY", "paddingBottom", "paddingLeft", "paddingRight", "paddingTop", "textAlign", "textOverflow", "textTransform", "whiteSpace", "wordBreak", "wordWrap"];

    function Mirror($inputor) {
        this.$inputor = $inputor;
    }

    Mirror.prototype.mirrorCss = function() {
        var css,
            _this = this;
        css = {
            position: 'absolute',
            left: -9999,
            top: 0,
            zIndex: -20000
        };
        if (this.$inputor['tagName'] === 'TEXTAREA') {
            this.css_attr.push('width');
        }
        // $.each(this.css_attr, function(i, p) {
        //     return css[p] = _this.$inputor.css(p);
        // });
        this.css_attr.map(function(p, i) { // 复制样式
            return css[p] = window.getComputedStyle(_this.$inputor)[p];
        })
        return css;
    };

    Mirror.prototype.create = function(html) {
        this.$mirror = document.createElement('div'); // node节点
        // this.$mirror.css(this.mirrorCss());
        var cssMap = this.mirrorCss();
        for (var cs in cssMap) { // 粘贴样式
            this.$mirror.style[cs] = cssMap[cs];
        }
        // this.$mirror.html(html);
        this.$mirror.innerHTML = html; // 写入镜子

        // this.$inputor.after(this.$mirror);
        this.$inputor.parentNode && this.$inputor.parentNode.insertBefore(this.$mirror, this.$inputor.nextSibling);

        return this;
    };

    Mirror.prototype.rect = function() {
        var $flag, pos, rect;
        // $flag = this.$mirror.find("#caret");
        $flag = this.$mirror.querySelector('#caret'); // 后代dom
        // pos = $flag.position();
        pos = { left: $flag.offsetLeft, top: $flag.offsetTop }
        rect = {
            left: pos.left,
            top: pos.top,
            // height: $flag.height()
            height: $flag.getBoundingClientRect().height // 拿到内联元素真实高度
        };
        // this.$mirror.remove();
        this.$mirror.parentNode && this.$mirror.parentNode.removeChild(this.$mirror); // 从父删除子

        return rect;
    };

    return Mirror;

})();

Utils = {

};

methods = {
    pos: function(pos) {
        if (pos || pos === 0) {
            return this.setPos(pos);
        } else {
            return this.getPos();
        }
    },
    position: function(pos) {
        if (oDocument.selection) {
            return this.getIEPosition(pos);
        } else {
            return this.getPosition(pos);
        }
    },
    offset: function(pos) {
        var offset;
        offset = this.getOffset(pos);
        return offset;
    }
};

oDocument = null;

oWindow = null;

oFrame = null;

var caret = function(method, value, settings) {
    var caret;
    if (methods[method]) {
        // if ($.isPlainObject(value)) {
        //     setContextBy(value);
        //     value = void 0;
        // } else {
        //     setContextBy(settings);
        // }
        oFrame = void 0;
        oWindow = window;
        oDocument = document;
        // 设置上下文

        // caret = Utils.contentEditable(this) ? new EditableCaret(this) : new InputCaret(this);
        caret = new InputCaret(this);
        return methods[method].apply(caret, [value]);
    } else {
        return console.error("Method " + method + " does not exist on jQuery.caret");
    }
};