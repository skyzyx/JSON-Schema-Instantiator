'use strict';

// The JSON Object that defines the default values of certain types.
var typesInstantiator = {
  'string': '',
  'number': 0,
  'integer': 0,
  'null': null,
  'boolean': false, // Always stay positive?
  'object': { }
};

/**
 * Checks whether a variable is a primitive.
 * @param obj - an object.
 * @returns {boolean}
 */
function isPrimitive(obj) {
  var type = obj.type;

  return typesInstantiator[type] !== undefined;
}

/**
 * Checks whether a property is on required array.
 * @param property - the property to check.
 * @param requiredArray - the required array
 * @returns {boolean}
 */
function isPropertyRequired(property, requiredArray) {
  var found = false;
  var i = 0;
  requiredArray = requiredArray || [];
  while (i < requiredArray.length && !found) {
      found = requiredArray[i] === property;
      i++;
  }
  return found;
}

/**
 * Instantiate a primitive.
 * @param val - The object that represents the primitive.
 * @returns {*}
 */
function instantiatePrimitive(val) {
  var type = val.type;

  // Support for default values in the JSON Schema.
  if (val.default) {
    return val.default;
  }

  return typesInstantiator[type];
}

/**
 * The main function.
 * Calls sub-objects recursively, depth first, using the sub-function 'visit'.
 * @param schema - The schema to instantiate.
 * @returns {*}
 */
function instantiate(schema, options) {
  options = options || {};

  /**
   * Visits each sub-object using recursion.
   * If it reaches a primitive, instantiate it.
   * @param obj - The object that represents the schema.
   * @param name - The name of the current object.
   * @param data - The instance data that represents the current object.
   */
  function visit(obj, name, data) {
    if (!obj) {
      return;
    }
    var i;
    var type = obj.type;
    // We want non-primitives objects (primitive === object w/o properties).
    if (type === 'object' && obj.properties) {
      data[name] = data[name] || { };

      // Visit each property.
      for (var property in obj.properties) {
        if (obj.properties.hasOwnProperty(property)) {
          if ((!options.requiredPropertiesOnly) || (options.requiredPropertiesOnly && isPropertyRequired(property, obj.required))) {
            visit(obj.properties[property], property, data[name]);   
          }
        }
      }
    } else if (obj.allOf) {
      for (i = 0; i < obj.allOf.length; i++) {
        visit(obj.allOf[i], name, data);
      }
    } else if (type === 'array') {
      data[name] = [];
      var len = 1;
      if (obj.minItems || obj.minItems === 0) {
        len = obj.minItems;
      }

      // Instantiate 'len' items.
      for (i = 0; i < len; i++) {
        visit(obj.items, i, data[name]);
      }

    } else if (isPrimitive(obj)) {
      data[name] = instantiatePrimitive(obj);
    }
  }

  var data = {};
  visit(schema, 'kek', data);
  return data['kek'];
}

// If we're using Node.js, export the module.
if (typeof module !== 'undefined') {
  module.exports = {
    instantiate: instantiate
  };
}
