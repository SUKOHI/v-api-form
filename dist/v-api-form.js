'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ApiFormFile = function ApiFormFile(file) {
    _classCallCheck(this, ApiFormFile);

    this.file = file;
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

                if (targetParam instanceof ApiFormFile) {

                    var file = targetParam.file;

                    if (file instanceof FileList) {

                        for (var i = 0; i < file.length; i++) {

                            var targetFile = file[i];
                            data.append(key + '[]', targetFile);
                        }
                    } else {

                        data.append(key, file);
                    }
                } else {

                    data.append(key, targetParam);
                }
            }

            if (extraParams !== undefined) {

                for (var _key in extraParams) {

                    data.append(_key, extraParams[_key]);
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

                errors[key] = formErrors[key] !== undefined ? formErrors[key] : '';
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
            this.$data[paramKey][valueKey] = new ApiFormFile(file);
        },

        // Others

        resetFormParams: function resetFormParams(targetKey) {

            this.clearParamFileInputs();
            var paramKey = this.getParamKey(targetKey);
            var originalParams = this.copyFormObject(this.originalParams[paramKey]);
            Vue.set(this, paramKey, originalParams);
        },
        clearFormParams: function clearFormParams(targetKey) {

            this.clearParamFileInputs();
            var paramKey = this.getParamKey(targetKey);
            var targetParams = this.$data[paramKey];
            var params = {};

            for (var key in targetParams) {

                if (this.originalParams[paramKey][key] === null) {

                    params[key] = null;
                } else {

                    params[key] = '';
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
        clearParamFileInputs: function clearParamFileInputs() {

            for (var key in this.paramFileInputs) {

                var fileInput = this.paramFileInputs[key];
                fileInput.value = '';
            }
        },
        copyFormObject: function copyFormObject(obj) {

            return JSON.parse(JSON.stringify(obj));
        }
    },
    mounted: function mounted() {

        this.apiFormInit();
    }
});