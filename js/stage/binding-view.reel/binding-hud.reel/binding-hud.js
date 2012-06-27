/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */

/**
@requires montage/core/core
@requires montage/ui/component
*/
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.BindingHud = Montage.create(Component, {
    scrollUp: {
        value: null
    },
    scrollable: {
        value: false
    },
    scrollInterval: {
        value: null
    },
    scrollDown: {
        value: null
    },
    scrollSpace: {
        value: 8
    },
    currentScrollDirection: {
        value: null
    },
    _bindingArgs: {
        value: null
    },

    titleElement: {
        value: null
    },

    boundProperties: {
        value: []
    },

    optionsRepeater: {
        value: null
    },

    _userComponent: { value: null  },
    userComponent: {
        get: function() {
            return this._userComponent;
        },
        set: function(val) {
            if(!val) { return; }

            var controller = this.application.ninja.objectsController,
                bindingView = this.parentComponent.parentComponent,
                isOffStage, icon, iconOffsets;

            this._userComponent = val;
            this.properties = controller.getPropertiesFromObject(val, true);

            controller.getObjectBindings(this.userComponent).forEach(function(obj) {
                this.boundProperties.push(obj.sourceObjectPropertyPath);
            }, this);

            isOffStage = controller.isOffStageObject(val);

            if(isOffStage) {
                icon = bindingView.getOffStageIcon(val);
                iconOffsets = this.getElementOffsetToParent(icon.element, bindingView.element);
                this.title = icon.name;
                this.x = iconOffsets.x;
                this.y = iconOffsets.y - 80;
            } else {
                this.title = val.identifier;
                this.x = val.element.offsetLeft;
                this.y = val.element.offsetTop;
            }

            this.needsDraw = true;

        }
    },

    properties: { value: [] },

    _isResizing: {
        value: null
    },

    _resizedX : {
        value: 0
    },

    _resizedY: {
        value: 0
    },

    handleResizeStart: {
        value:function(e) {
            this.isResizing = true;
            this.x = parseInt(this.x);
            this.y = parseInt(this.y);
            this.needsDraw = true;
            this.parentComponent.parentComponent.needsDraw = true;
        }
    },

    handleResizeMove: {
        value:function(e) {
            this._resizedY = e._event.dY;
            this._resizedX = e._event.dX;
            this.needsDraw = true;
            this.parentComponent.parentComponent.needsDraw = true;
        }
    },

    handleResizeEnd: {
        value: function(e) {
            this.x += this._resizedX;
            this.y += this._resizedY;
            this._resizedX = 0;
            this._resizedY = 0;
            this.isResizing = false;
            this.needsDraw = true;
            this.parentComponent.parentComponent.needsDraw = true;
        }
    },

    getElementOffsetToParent : {
        value: function(element, parent) {
            var nodeToPage = webkitConvertPointFromNodeToPage(element, new WebKitPoint(0, 0)),
                parentToPage = webkitConvertPointFromNodeToPage(parent, new WebKitPoint(0, 0));

            return {
                x : nodeToPage.x - parentToPage.x,
                y : nodeToPage.y - parentToPage.y
            }
        }
    },

    _x: {
        value: 20
    },

    _y: {
        value: 100
    },

    x: {
        get: function() {
            return this._x;
        },
        set: function(val) {
            this._x = val;
            this.needsDraw = true;
        }
    },

    y: {
        get: function() {
            return this._y;
        },
        set: function(val) {
            this._y = val;
            this.needsDraw = true;
        }
    },

    _title: {
        value: "default"
    },

    title: {
        get: function() {
            return this._title;
        },
        set: function(val) {
            this._title = val;
        }
    },

    prepareForDraw: {
        value: function() {
//            var arrProperties = this.application.ninja.objectsController.getEnumerableProperties(this._bindingArgs.sourceObject, true);
//            arrProperties.forEach(function(obj) {
//                var objBound = false;
//                if(this._bindingArgs._boundObjectPropertyPath === obj) {
//                    objBound = true;
//                }
//                this.properties.push({"title":obj, "bound": objBound});
//            }.bind(this));
            //this.parentComponent.parentComponent.handleShowBinding(this.application.ninja.objectsController.getObjectBindings(this.userComponent));
            if(this.scrollSpace < this.properties.length) {
                this.scrollUp.addEventListener("mouseover", this);
                this.scrollDown.addEventListener("mouseover", this);
                this.scrollUp.addEventListener("mouseout", this);
                this.scrollDown.addEventListener("mouseout", this);
                this.optionsRepeater.element.style.maxHeight = (this.scrollSpace * 18) + "px"
                this.scrollUp.style.display = "block";
                this.scrollDown.style.display = "block";
            }
        }
    },

    isOverScroller: {
        value: function(e) {
            if(this.scrollSpace < this.properties.length) {
                var isOverScroller = false;
                var mousePoint = webkitConvertPointFromPageToNode(this.element, new WebKitPoint(e.pageX, e.pageY));

                var scrollUpStartX = 5;
                var scrollUpEndX = scrollUpStartX + this.titleElement.offsetWidth;
                var scrollUpStartY = this.titleElement.offsetHeight + 5;
                var scrollUpEndY = scrollUpStartY + this.scrollUp.offsetHeight;
                if(scrollUpStartX < mousePoint.x && (scrollUpEndX) > mousePoint.x) {
                    if(scrollUpStartY < mousePoint.y && (scrollUpEndY) > mousePoint.y) {
                        this.handleScroll("up");
                        isOverScroller = true;
                    }
                }

                var scrollDownStartX = 5;
                var scrollDownEndX = scrollDownStartX + this.titleElement.offsetWidth;
                var scrollDownStartY = scrollUpEndY + this.optionsRepeater.element.offsetHeight;
                var scrollDownEndY = scrollDownStartY + this.scrollDown.offsetHeight;

                if(scrollDownStartX < mousePoint.x && (scrollDownEndX) > mousePoint.x) {
                    if(scrollDownStartY < mousePoint.y && (scrollDownEndY) > mousePoint.y) {
                        this.handleScroll("down");
                        isOverScroller = true;
                    }
                }

                if(!isOverScroller) {
                    clearInterval(this.scrollInterval);
                    this.scrollInterval = null;
                }
            }
        }
    },

    handleScroll: {
        value: function(direction) {
            if (this.scrollInterval === null) {
                if(direction === "down") {
                    this.scrollInterval = setInterval(function() {
                        this.optionsRepeater.element.scrollTop += 3;
                    }.bind(this), 50);
                } else {
                    this.scrollInterval = setInterval(function() {
                        this.optionsRepeater.element.scrollTop -= 3;
                    }.bind(this), 50);
                }
            }
        }
    },

    handleMouseover: {
        value: function(e) {
            if(this.scrollSpace < this.properties.length) {
                if (this.scrollInterval === null) {
                    if (e._event.target.classList.contains("scrollAreaBottom")) {
                        self = e._event.target.parentElement.controller;
                        //e._event.target.parentElement.controller.currentScrollDirection = "down";
                        this.scrollInterval = setInterval(function() {
                            self.optionsRepeater.element.scrollTop += 3;
                        }, 50);
                    } else {
                        this.scrollInterval = setInterval(function() {
                            self.optionsRepeater.element.scrollTop -= 3;
                        }, 50);
                    }
                }
            }
            //this.needsDraw = true;
        }
    },



    handleMouseout: {
        value: function() {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
            this.currentScrollDirection = null;
        }
    },

    draw: {
        value: function() {
            this.titleElement.innerHTML = this.title;
            this.element.style.top = (this.y + this._resizedY) + "px";
            this.element.style.left = (this.x + this._resizedX) + "px";

//            if(this.currentScrollDirection !== null) {
//                if(this.currentScrollDirection === "up") {
//                    this.optionsRepeater.element.scrollTop -= 18;
//                } else {
//                    this.optionsRepeater.element.scrollTop += 18;
//                }
//            }
        }
    },
    didDraw: {
        value: function() {
//            if (this.currentScrollDirection !== null) {
//                this.needsDraw=true;
//            }
        }
    }
});