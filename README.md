# v-api-form
A Vue package for managing FormData that is used as ajax parameters.

# Installation

    npm i v-api-form --save
    
# Preparation

First, set parameters in Vue.

    new Vue({
        el: '#app',
        data: {
            params: {
                email: '',
                password: '',
                categories: [], // e.g. multiple checkboxes
                nested_values: [
                    {id: 1, names: ['John', 'Mike']},
                    {id: 2, namess: ['Max']},
                    {id: 3, name: ['Ann', 'Christine']},
                ]
            }
        },
        
`params` is default data property for this package.  
In this case, `errors` is also set by default. 

And bind their data properties as usual.

    <input type="text" v-model="params.email">
    <input type="password" v-model="params.password">

# Usage

## FormData

You can get parameters through `FormData()`.

    const params = this.getFormData();
    
    // Or with extra parameters
    
    const params = this.getFormData({
        _method: 'PUT',             // string
        numbers: [1, 2, 3, 4, 5],    // array
        nested_values: [
            {id: 1, names: ['John', 'Mike']},
            {id: 2, namess: ['Max']},
            {id: 3, name: ['Ann', 'Christine']},
        ]
    });

## Errors

This package rearrange `errors` that has only first messages of errors through `setFormErrors()`.

    onSubmit: function() {

        axios.post(url, params)
            .then((response) => {

                // ..

            })
            .catch((error) => {

                this.setFormErrors(error);

            });

    },
        
Now `this.errors` will be changed to rearranged errors when you get errors.

Note:  
If your error has a key which includes dot-notation like `photos.0`, the message will be Object as follows.  

    {
        "0":"The photos.0 must be a file of type: jpg.",
        "1":"The photos.1 must be a file of type: jpg."
        "2":"The photos.2 must be a file of type: jpg."
    }

The rearrangement is mainly for axios and Laravel response.  
Please override `getFormErrors()` if you'd like to use other data construction.

    methods: {
        getFormErrors(error) {
        
            // Your code here.
        
            return errors;
        
        }
    }
    
If you'd like to retrieve an error by key or dot notation string, use getFormError() as follows.

    const error = this.getFormError('email');
    
    // with Default Value
    
    this.getFormError('users.0.email', 'Default Value');
    
    // or specify target
    
    this.getFormError('email', 'Default Value', 'customErrors');
        
    
## File

If you'd like to set `<input type="file">` in your page, use `v-file-model` in the same way as `v-model` .

    <input type="file" v-file-model="params.profile">
    
or in `v-for`
    
    <div v-for="(file,i) in params.files">
        <input type="file" v-file-model="'params.files.'+ i">
    </div>
    
In this case, set `File` or `FileList` as the default parameter.

    data: {
        params: {
            profile: File
        }
    }

Or multiply

    <input type="file" v-file-model="customParams.profiles" multiple>

    data: {
        params: {
            profiles: FileList
        }
    }

Note: 

When you use `multiple` for file input, parameter name is automatically changed.  
For example, `profiles[]` is the name in the above case.

## Clear and reset

### Parameters

    this.clearFormParams();     // inputs & files
    this.clearInputParams();    // only inputs
    this.clearFileParams();     // only files
    
    // or
    
    this.resetFormParams(); // change params to default values

### Errors

    this.clearFormErrors();

## Multiple usage

You may use several form in the same page.  
In a case like that, you can use `setApiFormParams()` to set multiple parameters.

    beforeMount: function() {
    
        this.setApiFormParams([
            {
                params: 'params',
                errors: 'errors'
            },
            {
                params: 'customParams',
                errors: 'customErrors'
            }
        ]);
        
    }
    
Now you have 2 form parameters.

### Specify target

You can specify target parameters/errors when using each methods in multiple parameter's environment.  

#### FormData
    const params = this.getFormData({}, 'customParams');
    
#### Errors
    this.setFormErrors(error, 'customParams');
    
### Clear and reset 

    // Parameter
    this.clearFormParams('customParams');   // inputs & files
    this.clearInputParams('customParams');  // only inputs
    this.clearFileParams('customParams');   // only files
    this.resetFormParams('customParams');   // reset params

    // Error
    this.clearFormErrors('customErrors');

# Resize image

You can automatically resize selected image(s) by setting `max-image-width` or `max-image-height` as follows.
    
    <!-- Width -->
    <input type="file" 
        accept="image/*" 
        max-image-width="300" 
        v-file-model="params.images">

    <!-- Height -->
    <input 
        type="file" 
        accept="image/*" 
        max-image-height="300" 
        v-file-model="params.images">
        
    <!-- Both -->
    <input 
        type="file" 
        accept="image/*" 
        max-image-width="300" 
        max-image-height="300" 
        v-file-model="params.images">

Note: If your application need to support ie 11, use 
[JavaScript Canvas to Blob](https://github.com/blueimp/JavaScript-Canvas-to-Blob).

# License
This package is licensed under the MIT License.

Copyright 2018 Sukohi Kuhoh
