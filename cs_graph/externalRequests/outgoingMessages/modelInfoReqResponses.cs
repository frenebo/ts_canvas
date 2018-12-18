using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.Collections.Generic;

namespace ModelInfoReqResponses {
  class ValidateEdgeResponseValid {
    public readonly bool valid = true;
  }

  class ValidateEdgeResponseInvalid {
    public readonly bool valid = false;
    public readonly string problem;

    public ValidateEdgeResponseInvalid(string problem) {
      this.problem = problem;
    }
  }

  class EdgesBetweenVerticesResponseVerticesExist {
    public readonly bool verticesExist = true;
    public readonly Dictionary<string, JsonGraphInterfaces.IEdgeData> edges;

    public EdgesBetweenVerticesResponseVerticesExist(
      Dictionary<string, JsonGraphInterfaces.IEdgeData> edges
    ) {
      this.edges = edges;
    }
  }

  class EdgesBetweenVerticesResponseVerticesNonexistent {
    public readonly bool verticesExist = false;
    public readonly string[] requestNonexistentVertices;

    public EdgesBetweenVerticesResponseVerticesNonexistent(string[] nonexistentVertices) {
      this.requestNonexistentVertices = nonexistentVertices;
    }
  }

  class FileIsOpenResponseNotOpen {
    public readonly bool fileIsOpen = false;
  }

  class FileIsOpenResponseOpen {
    public readonly bool fileIsOpen = true;
    public readonly string fileName;
    public readonly bool fileIsUpToDate;

    public FileIsOpenResponseOpen(string fileName, bool fileIsUpToDate) {
      this.fileName = fileName;
      this.fileIsUpToDate = fileIsUpToDate;
    }
  }

  class SavedFileNamesResponse {
    public readonly string[] fileNames;

    public SavedFileNamesResponse(string[] fileNames) {
      this.fileNames = fileNames;
    }
  }

  class GetPortInfoResponseCouldFindPort {
    public readonly bool couldFindPort = true;
    public readonly string portValue;

    public GetPortInfoResponseCouldFindPort(string portValue) {
      this.portValue = portValue;
    }
  }

  class GetPortInfoResponseCouldNotFindPort {
    public readonly bool couldFindPort = false;
  }

  class GetLayerInfoResponseLayerExists {
    public readonly bool layerExists = true;
    public readonly JsonGraphInterfaces.ILayerData data;

    public GetLayerInfoResponseLayerExists(JsonGraphInterfaces.ILayerData data) {
      this.data = data;
    }
  }

  class GetLayerInfoResponseLayerDoesNotExist {
    public readonly bool layerExists = false;
  }

  class ValidateValueResponseNoError {
    public readonly string requestError = null;
    public readonly string fieldValidationError;

    public ValidateValueResponseNoError(string error) {
      this.fieldValidationError = error;
    }
  }

  class ValidateValueResponseLayerNonexistentError {
    public readonly string requestError = "layer_nonexistent";
  }

  class ValidateValueResponseFieldNonexistError {
    public readonly string requestError = "field_nonexistent";
    public readonly string fieldName;

    public ValidateValueResponseFieldNonexistError(string fieldName) {
      this.fieldName = fieldName;
    }
  }

  class CompareValueResponseNoError {
    public readonly string requestError = null;
    public readonly bool isEqual;

    public CompareValueResponseNoError(bool isEqual) {
      this.isEqual = isEqual;
    }
  }

  class CompareValueResponseLayerNonexistentError {
    public readonly string requestError = "layer_nonexistent";
  }

  class CompareValueResponseFieldNonexistentError {
    public readonly string requestError = "field_nonexistent";
  }

  class ValidateLayerFieldsResponseNoError {
    public readonly string requestError = null;
    public readonly string[] errors;
    public readonly string[] warnings;

    public ValidateLayerFieldsResponseNoError(string[] errors, string[] warnings) {
      this.errors = errors;
      this.warnings = warnings;
    }
  }

  class ValidateLayerFieldsResponseLayerNonexistentError {
    public readonly string requestError = "layer_nonexistent";
  }

  class ValidateLayerFieldsResponseFieldNonexistent {
    public readonly string requestError = "field_nonexistent";
    public readonly string fieldName;

    public ValidateLayerFieldsResponseFieldNonexistent(string fieldName) {
      this.fieldName = fieldName;
    }
  }

  class GetUniqueEdgeIdsResponse {
    public readonly string[] edgeIds;

    public GetUniqueEdgeIdsResponse(string[] edgeIds) {
      this.edgeIds = edgeIds;
    }
  }

  class UniqueVertexIdsResponse {
    public readonly string[] vertexIds;

    public UniqueVertexIdsResponse(string[] vertexIds) {
      this.vertexIds = vertexIds;
    }
  }

  class ValueIsReadonlyResponseNotReadonly {
    public readonly string requestError = null;
    public readonly bool isReadonly = false;
  }

  enum ReadonlyReason { port_is_occupied, value_is_not_modifiable }

  class ValueIsReadonlyResponseIsReadonly {
    public readonly string requestError = null;
    public readonly bool isReadonly = true;

    [JsonConverter(typeof(StringEnumConverter))]
    public readonly ReadonlyReason reason;

    public ValueIsReadonlyResponseIsReadonly(ReadonlyReason reason) {
      this.reason = reason;
    }
  }

  class GetGraphDataResponse {
    public readonly JsonGraphInterfaces.IGraphData data;
    public readonly string versionId;

    public GetGraphDataResponse(JsonGraphInterfaces.IGraphData data, string versionId) {
      this.data = data;
      this.versionId = versionId;
    }
  }
}
