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

                if(targetParam instanceof ApiFormFile) {

                    const file = targetParam.file;

                    if(file instanceof FileList) {

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

                } else {

                    data.append(key, targetParam);

                }

            }

            if(extraParams !== undefined) {

                for(let key in extraParams) {

                    data.append(key, extraParams[key]);

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
            let targetErrors = this.$data[errorKey];
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
            this.$data[paramKey][valueKey] = new ApiFormFile(file);

        },

        // Others

        resetFormParams(targetKey) {

            this.clearParamFileInputs();
            const paramKey = this.getParamKey(targetKey);
            const originalParams = this.copyFormObject(this.originalParams[paramKey]);
            Vue.set(this, paramKey, originalParams);

        },
        clearFormParams(targetKey) {

            this.clearParamFileInputs();
            let paramKey = this.getParamKey(targetKey);
            let targetParams = this.$data[paramKey];
            let params = {};

            for(let key in targetParams) {

                if(this.originalParams[paramKey][key] === null) {

                    params[key] = null;

                } else {

                    params[key] = '';

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
        clearParamFileInputs() {

            for(let key in this.paramFileInputs) {

                let fileInput = this.paramFileInputs[key];
                fileInput.value = '';

            }

        },
        copyFormObject(obj) {

            return JSON.parse(JSON.stringify(obj));

        }
    },
    mounted() {

        this.apiFormInit();

    }
});