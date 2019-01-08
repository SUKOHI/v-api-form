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
                categories: [] // e.g. multiple checkboxes
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
    
    const params = this.getFormData({ _method: 'PUT' });

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

However, this is mainly for axios and Laravel response.  
Please override `getFormErrors()` if you'd like to use other data construction.

    methods: {
        getFormErrors(error) {
        
            // Your code here.
        
            return errors;
        
        }
    }
    
## File

If you'd like to set `<input type="file">` in your page, use `v-file-model` in the same way as `v-model` .

    <input type="file" v-file-model="params.profile">
    
In this case, you need to set `null` as the default parameter for `profile` .

    data: {
        params: {
            email: '',
            password: '',
            profile: null // <--HERE
        }
    }
    
Also you can use `multiple` property.

    <input type="file" v-file-model="customParams.profiles" multiple>
    
Note: 

When you use `multiple` for file input, parameter name is automatically changed.  
For example, `profiles[]` is the name in the above case.

## Clear and reset

### Parameters

    this.clearFormParams();
    
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

    this.clearFormParams('customParams');
    this.resetFormParams('customParams');
    this.clearFormErrors('customParams');
    
# License
This package is licensed under the MIT License.

Copyright 2018 Sukohi Kuhoh