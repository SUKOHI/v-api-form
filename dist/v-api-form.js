'use strict';

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
                        canvas.width = width;
                        canvas.height = height;
                        var ctx = canvas.getContext('2d');
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

        var fileKey = binding.expression;
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

            var paramKey = this.getParamKey(targetKey);
            var targetParams = this.$data[paramKey];
            var data = new FormData();

            for (var key in targetParams) {

                var targetParam = targetParams[key];

                if (targetParam === null) {

                    continue;
                }

                if (this.isApiFormFile(targetParam)) {

                    var file = targetParam.file;

                    if (targetParam.images) {

                        var resizedImages = targetParam.images.resizeData;

                        if (this.isTypeFileList(file)) {

                            for (var i = 0; i < resizedImages.length; i++) {

                                var targetFile = resizedImages[i];
                                data.append(key + '[]', targetFile);
                            }
                        } else {

                            data.append(key, resizedImages[0]);
                        }
                    } else {

                        if (this.isTypeFileList(file)) {

                            for (var _i = 0; _i < file.length; _i++) {

                                var _targetFile = file[_i];
                                data.append(key + '[]', _targetFile);
                            }
                        } else {

                            data.append(key, file);
                        }
                    }
                } else if (targetParam instanceof Array) {

                    for (var _i2 = 0; _i2 < targetParam.length; _i2++) {

                        data.append(key + '[]', targetParam[_i2]);
                    }
                } else if (typeof targetParam !== 'function') {

                    data.append(key, targetParam);
                }
            }

            if (extraParams !== undefined) {

                for (var _key in extraParams) {

                    var extraParam = extraParams[_key];

                    if (extraParam instanceof Array) {

                        for (var _i3 = 0; _i3 < extraParam.length; _i3++) {

                            data.append(_key + '[]', extraParam[_i3]);
                        }
                    } else {

                        data.append(_key, extraParam);
                    }
                }
            }

            return data;
        },
        getParamKey: function getParamKey(targetKey) {

            if (targetKey === undefined) {

                return this.paramProperties[0].params;
            }

            return targetKey;
        },
        getFormKeys: function getFormKeys(key) {

            var paramKey = '';
            var valueKey = '';

            if (key.indexOf('.') !== -1) {

                var keys = key.split('.');
                paramKey = keys[0];
                valueKey = keys[1];
            } else {

                paramKey = this.getParamKey();
                valueKey = key;
            }

            return {
                param: paramKey,
                value: valueKey
            };
        },
        getErrorKey: function getErrorKey(targetKey) {

            if (targetKey === undefined) {

                return this.paramProperties[0].errors;
            }

            return targetKey;
        },


        // This is mainly for axios and Laravel response.
        // Please override if you'd like to use other data construction.
        getFormErrors: function getFormErrors(error) {

            var errors = {};

            for (var key in error.response.data.errors) {

                var responseError = error.response.data.errors[key];

                if (typeof responseError === 'string') {

                    errors[key] = responseError;
                } else {

                    errors[key] = responseError[0];
                }
            }

            return errors;
        },


        // Setter

        setFormErrors: function setFormErrors(error, targetKey) {

            var errorKey = this.getErrorKey(targetKey);
            var targetErrors = this.$data[errorKey];
            var formErrors = this.getFormErrors(error);
            var errors = {};

            for (var key in targetErrors) {

                if (formErrors[key] !== undefined) {

                    errors[key] = formErrors[key];
                } else {

                    for (var formErrorKey in formErrors) {

                        if (formErrorKey.startsWith(key + '.')) {

                            var keys = formErrorKey.split('.');
                            var firstKey = keys[0];
                            var secondKey = keys[1];

                            if (targetErrors[firstKey] !== undefined) {

                                if (errors[firstKey] === undefined) {

                                    errors[firstKey] = {};
                                }

                                errors[firstKey][secondKey] = formErrors[formErrorKey];
                            }
                        }
                    }

                    if (errors[key] === undefined) {

                        errors[key] = '';
                    }
                }
            }

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
            var valueKey = keys.value;
            var options = {
                maxImageWidth: e.target.getAttribute('max-image-width'),
                maxImageHeight: e.target.getAttribute('max-image-height')
            };
            var currentParams = this.copyFormObject(this.$data[paramKey]);
            currentParams[valueKey] = new ApiFormFile(file, options);
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

            var paramKey = this.getParamKey(targetKey);
            var targetParams = this.$data[paramKey];
            var params = {};

            for (var key in targetParams) {

                var targetParam = targetParams[key];

                if (typeof targetParam === 'string' || typeof targetParam === 'number') {

                    params[key] = '';
                } else if (targetParam instanceof Array) {

                    params[key] = [];
                } else {

                    params[key] = targetParam;
                }
            }

            Vue.set(this, paramKey, params);
        },
        clearFileParams: function clearFileParams(targetKey) {

            var paramKey = this.getParamKey(targetKey);
            var targetParams = this.$data[paramKey];
            var params = {};

            for (var key in targetParams) {

                var targetParam = targetParams[key];
                var isFunction = typeof targetParam === 'function';
                var isApiFormFile = this.isApiFormFile(targetParam);

                if (isFunction || isApiFormFile) {

                    if (isFunction) {

                        if (this.isEmptyFile(targetParam)) {

                            params[key] = File;
                        } else if (this.isEmptyFileList(targetParam)) {

                            params[key] = FileList;
                        }
                    } else if (isApiFormFile) {

                        if (this.isTypeFile(targetParam)) {

                            params[key] = File;
                        } else if (this.isTypeFileList(targetParam.file)) {

                            params[key] = FileList;
                        }
                    }

                    var fileInput = this.paramFileInputs[paramKey + '.' + key];

                    if (fileInput !== undefined) {

                        fileInput.value = '';
                    }
                } else {

                    params[key] = targetParam;
                }
            }

            Vue.set(this, paramKey, params);
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

            var newObject = {};

            for (var key in obj) {

                var value = obj[key];

                if (typeof value === 'function') {

                    if (this.isEmptyFile(value)) {

                        newObject[key] = File;
                    } else if (this.isEmptyFileList(value)) {

                        newObject[key] = FileList;
                    }
                } else {

                    newObject[key] = value;
                }
            }

            return newObject;
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
        }
    },
    mounted: function mounted() {

        this.apiFormInit();
    }
});