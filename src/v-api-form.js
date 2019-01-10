class ApiFormFile {
    constructor(file) {
        this.file = file;
    }
}

Vue.directive('file-model', {
    bind(el, binding, vnode) {

        const fileKey = binding.expression;
        vnode.context.setParamFileInput(fileKey, el);

        el.addEventListener('change', (e) => {

            vnode.context.formFileChanged(e, fileKey)

        });

    }
});

Vue.mixin({
    data(){

        return {
            paramProperties: [
                {
                    params: 'params',
                    errors: 'errors'
                }
            ],
            params: {},
            errors: {},
            originalParams: {},
            paramFileInputs: {}
        }

    },
    methods: {

        // Init

        apiFormInit() {

            for(let i in this.paramProperties) {

                let properties = this.paramProperties[i];
                let paramKey = properties.params;
                let errorKey = properties.errors;
                let targetParams = this.$data[paramKey];
                let errors = {};

                for(let key in targetParams) {

                    errors[key] = '';

                }
                Vue.set(this, errorKey, errors);
                this.originalParams[paramKey] = this.copyFormObject(targetParams);

            }

        },

        // Getter

        getFormData(extraParams, targetKey) {

            const paramKey = this.getParamKey(targetKey);
            const targetParams = this.$data[paramKey];
            let data = new FormData();

            for(let key in targetParams) {

                let targetParam = targetParams[key];

                if(targetParam === null) {

                    continue;

                }

                if(this.isApiFormFile(targetParam)) {

                    const file = targetParam.file;

                    if(this.isTypeFileList(file)) {

                        for(let i = 0 ; i < file.length ; i++) {

                            let targetFile = file[i];
                            data.append(key +'[]', targetFile);

                        }

                    } else {

                        data.append(key, file);

                    }

                } else if(targetParam instanceof Array) {

                    for(let i = 0 ; i < targetParam.length ; i++) {

                        data.append(key +'[]', targetParam[i]);

                    }

                } else if(typeof targetParam !== 'function') {

                    data.append(key, targetParam);

                }

            }

            if(extraParams !== undefined) {

                for(let key in extraParams) {

                    var extraParam = extraParams[key];

                    if(extraParam instanceof Array) {

                        for(let i = 0 ; i < extraParam.length ; i++) {

                            data.append(key +'[]', extraParam[i]);

                        }

                    } else {

                        data.append(key, extraParam);

                    }

                }

            }

            return data;

        },
        getParamKey(targetKey) {

            if(targetKey === undefined) {

                return this.paramProperties[0].params;

            }

            return targetKey;

        },
        getFormKeys(key) {

            let paramKey = '';
            let valueKey = '';

            if(key.indexOf('.') !== -1) {

                const keys = key.split('.');
                paramKey = keys[0];
                valueKey = keys[1];

            } else {

                paramKey = this.getParamKey();
                valueKey = key;

            }

            return {
                param: paramKey,
                value: valueKey
            }

        },
        getErrorKey(targetKey) {

            if(targetKey === undefined) {

                return this.paramProperties[0].errors;

            }

            return targetKey;

        },

        // This is mainly for axios and Laravel response.
        // Please override if you'd like to use other data construction.
        getFormErrors(error) {

            let errors = {};

            for(let key in error.response.data.errors) {

                let responseError = error.response.data.errors[key];

                if(typeof responseError === 'string') {

                    errors[key] = responseError;

                } else {

                    errors[key] = responseError[0];

                }

            }

            return errors;

        },

        // Setter

        setFormErrors(error, targetKey) {

            const errorKey = this.getErrorKey(targetKey);
            const targetErrors = this.$data[errorKey];
            const formErrors = this.getFormErrors(error);
            let errors = {};

            for(let key in targetErrors) {

                errors[key] = (formErrors[key] !== undefined) ? formErrors[key] : '';

            }

            Vue.set(this, errorKey, errors);

        },
        setApiFormParams(params) {

            this.paramProperties = params;

        },
        setParamFileInput(fileKey, el) {

            this.paramFileInputs[fileKey] = el;

        },

        // Event

        formFileChanged: function(e, fileKey) {

            const file = (e.target.multiple)
                ? e.target.files
                : e.target.files[0];
            const keys = this.getFormKeys(fileKey);
            const paramKey = keys.param;
            const valueKey = keys.value;
            let currentParams = this.copyFormObject(this.$data[paramKey]);
            currentParams[valueKey] = new ApiFormFile(file);
            Vue.set(this, paramKey, currentParams);

        },

        // Others

        resetFormParams(targetKey) {

            this.clearFileParams(targetKey);
            const paramKey = this.getParamKey(targetKey);
            const originalParams = this.copyFormObject(this.originalParams[paramKey]);
            Vue.set(this, paramKey, originalParams);

        },
        clearFormParams(targetKey) {

            this.clearFileParams(targetKey);
            this.clearInputParams(targetKey);

        },
        clearInputParams(targetKey) {

            const paramKey = this.getParamKey(targetKey);
            const targetParams = this.$data[paramKey];
            let params = {};

            for(let key in targetParams) {

                let targetParam = targetParams[key];

                if(typeof targetParam === 'string' ||
                    typeof targetParam === 'number') {

                    params[key] = '';

                } else if(targetParam instanceof Array) {

                    params[key] = [];

                } else {

                    params[key] = targetParam;

                }

            }

            Vue.set(this, paramKey, params);

        },
        clearFileParams(targetKey) {

            const paramKey = this.getParamKey(targetKey);
            const targetParams = this.$data[paramKey];
            let params = {};

            for(let key in targetParams) {

                let targetParam = targetParams[key];
                let isFunction = (typeof targetParam === 'function');
                let isApiFormFile = this.isApiFormFile(targetParam);

                if(isFunction || isApiFormFile) {

                    if(isFunction) {

                        if(this.isEmptyFile(targetParam)) {

                            params[key] = File;

                        } else if(this.isEmptyFileList(targetParam)) {

                            params[key] = FileList;

                        }

                    } else if(isApiFormFile) {

                        if(this.isTypeFile(targetParam)) {

                            params[key] = File;

                        } else if(this.isTypeFileList(targetParam.file)) {

                            params[key] = FileList;

                        }

                    }

                    let fileInput = this.paramFileInputs[paramKey +'.'+ key];
                    fileInput.value = '';

                } else {

                    params[key] = targetParam;

                }

            }

            Vue.set(this, paramKey, params);

        },
        clearFormErrors(targetKey) {

            let errorKey = this.getErrorKey(targetKey);
            let targetErrors = this.$data[errorKey];
            let errors = {};

            for(let key in targetErrors) {

                errors[key] = '';

            }

            Vue.set(this, errorKey, errors);

        },
        clearFormOriginalParams() {

            this.originalParams = {};

            for(let i in this.paramProperties) {

                let properties = this.paramProperties[i];
                let paramKey = properties.params;
                this.originalParams[paramKey] = {};

            }

        },
        copyFormObject(obj) {

            let newObject = {};

            for(let key in obj) {

                let value = obj[key];

                if(typeof value === 'function') {

                    if(this.isEmptyFile(value)) {

                        newObject[key] = File;

                    } else if(this.isEmptyFileList(value)) {

                        newObject[key] = FileList;

                    }

                } else {

                    newObject[key] = value;

                }

            }

            return newObject;

        },
        isTypeFile: function(value) {

            return (value instanceof File);

        },
        isTypeFileList: function(value) {

            return (value instanceof FileList);

        },
        isEmptyFile: function(value) {

            return (value === File);

        },
        isEmptyFileList: function(value) {

            return (value === FileList);

        },
        isApiFormFile: function(value) {

            return (value instanceof ApiFormFile);

        }
    },
    mounted() {

        this.apiFormInit();

    }
});