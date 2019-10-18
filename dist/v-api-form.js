'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ApiFormFile = function ApiFormFile(file, options) {
    var _this = this;

    _classCallCheck(this, ApiFormFile);

    this.file = file;

    if (options.maxImageWidth || options.maxImageHeight) {
        (function () {

            _this.images = {
                isResizing: true,
                resizeData: []
            };
            var maxImageWidth = options.maxImageWidth;
            var maxImageHeight = options.maxImageHeight;
            var resizingFiles = _this.file;

            if (resizingFiles instanceof File) {

                resizingFiles = [resizingFiles];
            }

            var _loop = function _loop(i) {

                var resizingFile = resizingFiles[i];
                var reader = new FileReader();
                reader.onload = function (e) {

                    var img = new Image();
                    img.onload = function () {

                        var width = img.width;
                        var height = img.height;

                        if (maxImageWidth && width > maxImageWidth) {

                            height = Math.round(height * maxImageWidth / width);
                            width = maxImageWidth;
                        }

                        if (maxImageHeight && height > maxImageHeight) {

                            width = Math.round(width * maxImageHeight / height);
                            height = maxImageHeight;
                        }

                        var canvas = document.createElement('canvas');
                        var ctx = canvas.getContext('2d');
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        ctx.canvas.toBlob(function (blob) {

                            blob.lastModifiedDate = new Date();
                            blob.name = resizingFile.name;

                            _this.images.resizeData.push(blob);

                            if (resizingFiles.length === _this.images.resizeData.length) {

                                _this.images.isResizing = false;
                            }
                        }, resizingFile.type, 1);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(resizingFile);
            };

            for (var i = 0; i < resizingFiles.length; i++) {
                _loop(i);
            }
        })();
    }
};

Vue.directive('file-model', {
    bind: function bind(el, binding, vnode) {

        var fileKey = typeof binding.value === 'string' ? binding.value : binding.expression;
        vnode.context.setParamFileInput(fileKey, el);

        el.addEventListener('change', function (e) {

            vnode.context.formFileChanged(e, fileKey);
        });
    }
});

Vue.mixin({
    data: function data() {

        return {
            paramProperties: [{
                params: 'params',
                errors: 'errors'
            }],
            params: {},
            errors: {},
            originalParams: {},
            paramFileInputs: {}
        };
    },

    methods: {

        // Init

        apiFormInit: function apiFormInit() {

            for (var i in this.paramProperties) {

                var properties = this.paramProperties[i];
                var paramKey = properties.params;
                var errorKey = properties.errors;
                var targetParams = this.$data[paramKey];
                var errors = {};

                for (var key in targetParams) {

                    errors[key] = '';
                }
                Vue.set(this, errorKey, errors);
                this.originalParams[paramKey] = this.copyFormObject(targetParams);
            }
        },


        // Getter

        getFormData: function getFormData(extraParams, targetKey) {
            var _this2 = this;

            var formData = new FormData();

            var appendFormData = function appendFormData(data, keys) {

                if (keys === undefined) {

                    keys = [];
                }

                var appendKey = _this2.getAppendKey(keys);

                if (_this2.isApiFormFile(data)) {

                    var file = data.file;

                    if (data.images) {

                        var resizedImages = data.images.resizeData;

                        if (_this2.isTypeFileList(file)) {

                            for (var i = 0; i < resizedImages.length; i++) {

                                var targetFile = resizedImages[i];
                                formData.append(appendKey, targetFile);
                            }
                        } else {

                            formData.append(appendKey, resizedImages[0]);
                        }
                    } else {

                        if (_this2.isTypeFileList(file)) {

                            for (var _i = 0; _i < file.length; _i++) {

                                var _targetFile = file[_i];
                                formData.append(appendKey, _targetFile);
                            }
                        } else {

                            formData.append(appendKey, file);
                        }
                    }
                } else if (_this2.isArray(data)) {

                    var arrayItems = data;

                    for (var j = 0; j < arrayItems.length; j++) {

                        var arrayItem = arrayItems[j];
                        appendFormData(arrayItem, _this2.getAppendKeys(keys, j));
                    }
                } else if (_this2.isObject(data)) {

                    for (var key in data) {

                        var objectItem = data[key];
                        appendFormData(objectItem, _this2.getAppendKeys(keys, key));
                    }
                } else if (typeof data !== 'function') {

                    formData.append(appendKey, data);
                }
            };

            var paramKey = this.getParamKey(targetKey);
            var targetParams = this.$data[paramKey];
            appendFormData(targetParams);

            if (extraParams !== undefined) {

                appendFormData(extraParams);
            }

            return formData;
        },
        getParamKey: function getParamKey(targetKey) {

            if (targetKey === undefined) {

                return this.paramProperties[0].params;
            }

            return targetKey;
        },
        getFormKeys: function getFormKeys(key) {

            var paramKey = '';
            var valueKeys = [];

            if (key.indexOf('.') !== -1) {

                var keys = key.split('.');
                paramKey = keys[0];
                keys.shift();
                valueKeys = keys;
            } else {

                paramKey = this.getParamKey();
                valueKeys = [key];
            }

            return {
                param: paramKey,
                value: valueKeys
            };
        },
        getErrorKey: function getErrorKey(targetKey) {

            if (targetKey === undefined) {

                return this.paramProperties[0].errors;
            }

            return targetKey;
        },


        // This is mainly for axios and Laravel response.
        // Please override if you'd like to use other data structure.
        getFormErrors: function getFormErrors(error) {

            var errors = {};

            for (var key in error.response.data.errors) {

                var responseError = error.response.data.errors[key];

                if (this.isString(responseError)) {

                    errors[key] = responseError;
                } else {

                    errors[key] = responseError[0];
                }
            }

            return errors;
        },
        getFormError: function getFormError(key, defaultValue, targetKey) {

            if (defaultValue === undefined) {

                defaultValue = '';
            }

            var errorKey = this.getErrorKey(targetKey);
            var targetErrors = this[errorKey];

            var tempErrors = targetErrors;
            var keys = key.split('.');

            for (var i = 0; i < keys.length; i++) {

                var _targetKey = keys[i];

                if (tempErrors[_targetKey] !== undefined) {

                    tempErrors = tempErrors[_targetKey];
                } else {

                    return defaultValue;
                }
            }

            return tempErrors;
        },
        getAppendKey: function getAppendKey(keys) {

            var keyparts = [];

            for (var i = 0; i < keys.length; i++) {

                var key = keys[i];

                if (i === 0) {

                    keyparts.push(key);
                } else {

                    keyparts.push('[' + key + ']');
                }
            }

            return keyparts.join('');
        },
        getAppendKeys: function getAppendKeys(baseKeys, additionalKey) {

            var newKeys = [];

            for (var i = 0; i < baseKeys.length; i++) {

                var baseKey = baseKeys[i];
                newKeys.push(baseKey);
            }

            newKeys.push(additionalKey);
            return newKeys;
        },


        // Setter

        setFormErrors: function setFormErrors(error, targetKey) {

            var errorKey = this.getErrorKey(targetKey);
            var formErrors = this.getFormErrors(error);
            var errors = this.dotNotationToObject(formErrors);
            Vue.set(this, errorKey, errors);
        },
        setApiFormParams: function setApiFormParams(params) {

            this.paramProperties = params;
        },
        setParamFileInput: function setParamFileInput(fileKey, el) {

            this.paramFileInputs[fileKey] = el;
        },


        // Event

        formFileChanged: function formFileChanged(e, fileKey) {

            var file = e.target.multiple ? e.target.files : e.target.files[0];
            var keys = this.getFormKeys(fileKey);
            var paramKey = keys.param;
            var valueKeys = keys.value;
            var options = {
                maxImageWidth: e.target.getAttribute('max-image-width'),
                maxImageHeight: e.target.getAttribute('max-image-height')
            };
            var currentParams = this.copyFormObject(this.$data[paramKey]);

            if (valueKeys.length > 1) {

                var tempObj = currentParams;
                var lastKey = valueKeys.pop();
                var valueKeysLength = valueKeys.length;

                for (var i = 0; i < valueKeysLength; i++) {

                    var firstKey = valueKeys.shift();
                    tempObj[firstKey] = tempObj[firstKey] || {};
                    tempObj = tempObj[firstKey];
                }

                tempObj[lastKey] = new ApiFormFile(file, options);
            } else {

                var targetKey = valueKeys[0];
                currentParams[targetKey] = new ApiFormFile(file, options);
            }

            Vue.set(this, paramKey, currentParams);
        },

        // Others

        resetFormParams: function resetFormParams(targetKey) {

            this.clearFileParams(targetKey);
            var paramKey = this.getParamKey(targetKey);
            var originalParams = this.copyFormObject(this.originalParams[paramKey]);
            Vue.set(this, paramKey, originalParams);
        },
        clearFormParams: function clearFormParams(targetKey) {

            this.clearFileParams(targetKey);
            this.clearInputParams(targetKey);
        },
        clearInputParams: function clearInputParams(targetKey) {
            var _this3 = this;

            var paramKey = this.getParamKey(targetKey);
            var params = this.$data[paramKey];
            var map = function map(data, keys) {

                if (keys === undefined) {

                    keys = [];
                }

                if (_this3.isArray(data)) {

                    if (_this3.hasObjectInArray(data)) {

                        for (var i = 0; i < data.length; i++) {

                            var newKeys = keys.concat(i);
                            map(data[i], newKeys);
                        }
                    } else {

                        _this3.setNestedValue(params, keys, []);
                    }
                } else if (_this3.isObject(data)) {

                    for (var key in data) {

                        var _newKeys = keys.concat(key);
                        map(data[key], _newKeys);
                    }
                } else if (_this3.isString(data) || _this3.isNumber(data)) {

                    _this3.setNestedValue(params, keys, '');
                }
            };

            map(params);
        },
        clearFileParams: function clearFileParams(targetKey) {
            var _this4 = this;

            var paramKey = this.getParamKey(targetKey);
            var params = this.$data[paramKey];

            var map = function map(data, keys) {

                if (keys === undefined) {

                    keys = [];
                }

                if (_this4.isApiFormFile(data)) {

                    if (_this4.isTypeFile(data.file)) {

                        _this4.setNestedValue(params, keys, File);
                    } else if (_this4.isTypeFileList(data.file)) {

                        _this4.setNestedValue(params, keys, FileList);
                    }

                    var fileInput = _this4.paramFileInputs[paramKey + '.' + keys.join('.')];

                    if (fileInput !== undefined) {

                        fileInput.value = '';
                    }
                } else if (_this4.isArray(data)) {

                    if (_this4.hasObjectInArray(data)) {

                        for (var i = 0; i < data.length; i++) {

                            var newKeys = keys.concat(i);
                            map(data[i], newKeys);
                        }
                    } else {

                        _this4.setNestedValue(params, keys, []);
                    }
                } else if (_this4.isObject(data)) {

                    for (var key in data) {

                        var _newKeys2 = keys.concat(key);
                        map(data[key], _newKeys2);
                    }
                }
            };

            map(params);
        },
        clearFormErrors: function clearFormErrors(targetKey) {

            var errorKey = this.getErrorKey(targetKey);
            var targetErrors = this.$data[errorKey];
            var errors = {};

            for (var key in targetErrors) {

                errors[key] = '';
            }

            Vue.set(this, errorKey, errors);
        },
        clearFormOriginalParams: function clearFormOriginalParams() {

            this.originalParams = {};

            for (var i in this.paramProperties) {

                var properties = this.paramProperties[i];
                var paramKey = properties.params;
                this.originalParams[paramKey] = {};
            }
        },
        copyFormObject: function copyFormObject(obj) {
            var _this5 = this;

            var newObject = JSON.parse(JSON.stringify(obj));

            var map = function map(data, keys) {

                if (keys === undefined) {

                    keys = [];
                }

                if (_this5.isEmptyFile(data)) {

                    _this5.setNestedValue(newObject, keys, File);
                } else if (_this5.isEmptyFileList(data)) {

                    _this5.setNestedValue(newObject, keys, FileList);
                } else if (_this5.isApiFormFile(data)) {

                    _this5.setNestedValue(newObject, keys, data);
                } else if (_this5.isArray(data)) {

                    var arrayItems = data;

                    for (var i = 0; i < arrayItems.length; i++) {

                        var arrayItem = arrayItems[i];
                        var newKeys = keys.concat(i);
                        map(arrayItem, newKeys);
                    }
                } else if (_this5.isObject(data)) {

                    for (var key in data) {

                        var objectItem = data[key];
                        var _newKeys3 = keys.concat(key);
                        map(objectItem, _newKeys3);
                    }
                }
            };

            map(obj);
            return newObject;
        },
        dotNotationToObject: function dotNotationToObject(dotNotationObj) {

            var convertedObj = {};

            for (var key in dotNotationObj) {

                var tempObj = convertedObj;
                var valueKeys = key.split('.');
                var lastKey = valueKeys.pop();
                var valueKeysLength = valueKeys.length;

                for (var i = 0; i < valueKeysLength; i++) {

                    var firstKey = valueKeys.shift();
                    tempObj[firstKey] = tempObj[firstKey] || {};
                    tempObj = tempObj[firstKey];
                }

                tempObj[lastKey] = dotNotationObj[key];
            }

            return convertedObj;
        },

        setNestedValue: function setNestedValue(obj, keys, value) {

            for (var i = 0; i < keys.length; i++) {

                var key = keys[i];

                if (i === keys.length - 1) {

                    obj = obj[key] = value;
                } else {

                    obj = obj[key] = obj[key] || {};
                }
            }
        },
        isTypeFile: function isTypeFile(value) {

            return value instanceof File;
        },
        isTypeFileList: function isTypeFileList(value) {

            return value instanceof FileList;
        },
        isEmptyFile: function isEmptyFile(value) {

            return value === File;
        },
        isEmptyFileList: function isEmptyFileList(value) {

            return value === FileList;
        },
        isApiFormFile: function isApiFormFile(value) {

            return value instanceof ApiFormFile;
        },
        isArray: function isArray(value) {

            return value instanceof Array;
        },
        isObject: function isObject(value) {

            return !this.isEmptyFile(value) && !this.isEmptyFileList(value) && !this.isTypeFile(value) && !this.isTypeFileList(value) && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object';
        },
        isString: function isString(value) {

            return typeof value === 'string';
        },
        isNumber: function isNumber(value) {

            return typeof value === 'number';
        },
        hasObjectInArray: function hasObjectInArray(values) {

            for (var i = 0; i < values.length; i++) {

                var value = values[i];

                if (this.isObject(value)) {

                    return true;
                }
            }

            return false;
        }
    },
    mounted: function mounted() {

        this.apiFormInit();
    }
});