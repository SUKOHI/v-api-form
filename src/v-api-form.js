class ApiFormFile {
    constructor(file, options) {

        this.file = file;

        if(options.maxImageWidth || options.maxImageHeight) {

            this.images = {
                isResizing: true,
                resizeData: []
            };
            const maxImageWidth = options.maxImageWidth;
            const maxImageHeight = options.maxImageHeight;
            let resizingFiles = this.file;

            if(resizingFiles instanceof File) {

                resizingFiles = [resizingFiles];

            }

            for(let i = 0 ; i < resizingFiles.length ; i++) {

                let resizingFile = resizingFiles[i];
                let reader = new FileReader();
                reader.onload = (e) => {

                    let img = new Image();
                    img.onload = () => {

                        let width = img.width;
                        let height = img.height;

                        if(maxImageWidth && width > maxImageWidth) {

                            height = Math.round(height * maxImageWidth / width);
                            width = maxImageWidth;

                        }

                        if(maxImageHeight && height > maxImageHeight) {

                            width = Math.round(width * maxImageHeight / height);
                            height = maxImageHeight;

                        }

                        let canvas = document.createElement('canvas');
                        let ctx = canvas.getContext('2d');
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        ctx.canvas.toBlob((blob) => {

                            blob.lastModifiedDate = new Date();
                            blob.name = resizingFile.name;

                            this.images.resizeData.push(blob);

                            if(resizingFiles.length === this.images.resizeData.length) {

                                this.images.isResizing = false;

                            }

                        }, resizingFile.type, 1);

                    };
                    img.src = e.target.result;

                };
                reader.readAsDataURL(resizingFile);

            }

        }

    }
}

Vue.directive('file-model', {
    bind(el, binding, vnode) {

        const fileKey = (typeof binding.value === 'string') ? binding.value : binding.expression;
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

            let formData = new FormData();

            const appendFormData = (data, keys) => {

                if(keys === undefined) {

                    keys = [];

                }

                const appendKey = this.getAppendKey(keys);

                if(this.isApiFormFile(data)) {

                    const file = data.file;

                    if(data.images) {

                        const resizedImages = data.images.resizeData;

                        if(this.isTypeFileList(file)) {

                            for(let i = 0 ; i < resizedImages.length ; i++) {

                                let targetFile = resizedImages[i];
                                formData.append(appendKey, targetFile);

                            }

                        } else {

                            formData.append(appendKey, resizedImages[0]);

                        }

                    } else {

                        if(this.isTypeFileList(file)) {

                            for(let i = 0 ; i < file.length ; i++) {

                                let targetFile = file[i];
                                formData.append(appendKey, targetFile);

                            }

                        } else {

                            formData.append(appendKey, file);

                        }

                    }

                } else if(this.isArray(data)) {

                    let arrayItems = data;

                    for(let j = 0 ; j < arrayItems.length ; j++) {

                        let arrayItem = arrayItems[j];
                        appendFormData(arrayItem,  this.getAppendKeys(keys, j));

                    }

                } else if(this.isObject(data)) {

                    for(let key in data) {

                        let objectItem = data[key];
                        appendFormData(objectItem, this.getAppendKeys(keys, key));

                    }

                } else if(typeof data !== 'function') {

                    formData.append(appendKey, data);

                }

            };

            const paramKey = this.getParamKey(targetKey);
            const targetParams = this.$data[paramKey];
            appendFormData(targetParams);

            if(extraParams !== undefined) {

                appendFormData(extraParams);

            }

            return formData;

        },
        getParamKey(targetKey) {

            if(targetKey === undefined) {

                return this.paramProperties[0].params;

            }

            return targetKey;

        },
        getFormKeys(key) {

            let paramKey = '';
            let valueKeys = [];

            if(key.indexOf('.') !== -1) {

                const keys = key.split('.');
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
            }

        },
        getErrorKey(targetKey) {

            if(targetKey === undefined) {

                return this.paramProperties[0].errors;

            }

            return targetKey;

        },

        // This is mainly for axios and Laravel response.
        // Please override if you'd like to use other data structure.
        getFormErrors(error) {

            let errors = {};

            for(let key in error.response.data.errors) {

                let responseError = error.response.data.errors[key];

                if(this.isString(responseError)) {

                    errors[key] = responseError;

                } else {

                    errors[key] = responseError[0];

                }

            }

            return errors;

        },
        getFormError(key, defaultValue, targetKey) {

            if(defaultValue === undefined) {

                defaultValue = '';

            }

            const errorKey = this.getErrorKey(targetKey);
            const targetErrors = this[errorKey];

            let tempErrors = targetErrors;
            let keys = key.split('.');

            for(let i = 0 ; i < keys.length; i++) {

                let targetKey = keys[i];

                if(tempErrors[targetKey] !== undefined) {

                    tempErrors = tempErrors[targetKey];

                } else {

                    return defaultValue;

                }

            }

            return tempErrors;

        },
        getAppendKey(keys) {

            let keyparts = [];

            for(let i = 0 ; i < keys.length ; i++) {

                let key = keys[i];

                if(i === 0) {

                    keyparts.push(key);

                } else {

                    keyparts.push('['+ key +']');

                }

            }

            return keyparts.join('');

        },
        getAppendKeys(baseKeys, additionalKey) {

            let newKeys = [];

            for(let i = 0 ; i < baseKeys.length ; i++) {

                let baseKey = baseKeys[i];
                newKeys.push(baseKey);

            }

            newKeys.push(additionalKey);
            return newKeys;

        },

        // Setter

        setFormErrors(error, targetKey) {

            const errorKey = this.getErrorKey(targetKey);
            const formErrors = this.getFormErrors(error);
            let errors = this.dotNotationToObject(formErrors);
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
            const valueKeys = keys.value;
            const options = {
                maxImageWidth: e.target.getAttribute('max-image-width'),
                maxImageHeight: e.target.getAttribute('max-image-height')
            };
            let currentParams = this.copyFormObject(this.$data[paramKey]);

            if(valueKeys.length > 1) {

                let tempObj = currentParams;
                let lastKey = valueKeys.pop();
                let valueKeysLength = valueKeys.length;

                for(let i = 0 ; i < valueKeysLength ; i++) {

                    let firstKey = valueKeys.shift();
                    tempObj[firstKey] = tempObj[firstKey] || {};
                    tempObj = tempObj[firstKey];

                }

                tempObj[lastKey] = new ApiFormFile(file, options);

            } else {

                const targetKey = valueKeys[0];
                currentParams[targetKey] = new ApiFormFile(file, options);

            }

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
            const params = this.$data[paramKey];
            const map = (data, keys) => {

                if(keys === undefined) {

                    keys = [];

                }

                if(this.isArray(data)) {

                    if(this.hasObjectInArray(data)) {

                        for(let i = 0 ; i < data.length ; i++) {

                            let newKeys = keys.concat(i);
                            map(data[i], newKeys);

                        }

                    } else {

                        this.setNestedValue(params, keys, [])

                    }

                } else if(this.isObject(data)) {

                    for(let key in data) {

                        let newKeys = keys.concat(key);
                        map(data[key], newKeys);

                    }

                } else if(this.isString(data) || this.isNumber(data)) {

                    this.setNestedValue(params, keys, '')

                }

            };

            map(params);

        },
        clearFileParams(targetKey) {

            const paramKey = this.getParamKey(targetKey);
            const params = this.$data[paramKey];

            const map = (data, keys) => {

                if(keys === undefined) {

                    keys = [];

                }

                if(this.isApiFormFile(data)) {

                    if(this.isTypeFile(data.file)) {

                        this.setNestedValue(params, keys, File)

                    } else if(this.isTypeFileList(data.file)) {

                        this.setNestedValue(params, keys, FileList)

                    }

                    let fileInput = this.paramFileInputs[paramKey +'.'+ keys.join('.')];

                    if(fileInput !== undefined) {

                        fileInput.value = '';

                    }

                } else if(this.isArray(data)) {

                    if(this.hasObjectInArray(data)) {

                        for(let i = 0 ; i < data.length ; i++) {

                            let newKeys = keys.concat(i);
                            map(data[i], newKeys);

                        }

                    } else {

                        this.setNestedValue(params, keys, [])

                    }

                } else if(this.isObject(data)) {

                    for(let key in data) {

                        let newKeys = keys.concat(key);
                        map(data[key], newKeys);

                    }

                }

            };

            map(params);

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
        copyFormObject(obj) {

            let newObject = JSON.parse(JSON.stringify(obj));

            const map = (data, keys) => {

                if(keys === undefined) {

                    keys = [];

                }

                if(this.isEmptyFile(data)) {

                    this.setNestedValue(newObject, keys, File);

                } else if(this.isEmptyFileList(data)) {

                    this.setNestedValue(newObject, keys, FileList);

                } else if(this.isApiFormFile(data)) {

                    this.setNestedValue(newObject, keys, data);

                } else if(this.isArray(data)) {

                    let arrayItems = data;

                    for(let i = 0 ; i < arrayItems.length ; i++) {

                        let arrayItem = arrayItems[i];
                        let newKeys = keys.concat(i);
                        map(arrayItem, newKeys);

                    }

                } else if(this.isObject(data)) {

                    for(let key in data) {

                        let objectItem = data[key];
                        let newKeys = keys.concat(key);
                        map(objectItem, newKeys);

                    }

                }

            };

            map(obj);
            return newObject;

        },
        dotNotationToObject(dotNotationObj) {

            let convertedObj = {};

            for(let key in dotNotationObj) {

                let tempObj = convertedObj;
                let valueKeys = key.split('.');
                let lastKey = valueKeys.pop();
                let valueKeysLength = valueKeys.length;

                for(let i = 0 ; i < valueKeysLength ; i++) {

                    let firstKey = valueKeys.shift();
                    tempObj[firstKey] = tempObj[firstKey] || {};
                    tempObj = tempObj[firstKey];

                }

                tempObj[lastKey] = dotNotationObj[key]

            }

            return convertedObj;

        },
        setNestedValue: function(obj, keys, value) {

            for(let i = 0; i < keys.length; i++) {

                let key = keys[i];

                if(i === keys.length-1) {

                    obj = obj[key] = value;

                } else {

                    obj = obj[key] = obj[key] || {};

                }

            }

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

        },
        isArray: function(value) {

            return (value instanceof Array);

        },
        isObject: function(value) {

            return (
                !this.isEmptyFile(value) &&
                !this.isEmptyFileList(value) &&
                !this.isTypeFile(value) &&
                !this.isTypeFileList(value) &&
                typeof value === 'object'
            );

        },
        isString: function(value) {

            return (typeof value === 'string');

        },
        isNumber: function(value) {

            return (typeof value === 'number');

        },
        hasObjectInArray: function(values) {

            for(let i = 0 ; i < values.length ; i++) {

                let value = values[i];

                if(this.isObject(value)) {

                    return true;

                }

            }

            return false;

        }
    },
    mounted() {

        this.apiFormInit();

    }
});
