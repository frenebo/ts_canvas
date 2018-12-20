using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.Collections.Generic;

namespace ModelInfoReqResponses {
  public abstract class ModelInfoReqResponse {
  }

  public class ValidateEdgeResponseValid : ModelInfoReqResponse {
    public readonly bool valid = true;
  }

  public class ValidateEdgeResponseInvalid : ModelInfoReqResponse {
    public readonly bool valid = false;
    public readonly string problem;

    public ValidateEdgeResponseInvalid(string problem) {
      this.problem = problem;
    }
  }

  public class EdgesBetweenVerticesResponseVerticesExist : ModelInfoReqResponse {
    public readonly bool verticesExist = true;
    public readonly Dictionary<string, ResponseJson.EdgeData> edges;

    public EdgesBetweenVerticesResponseVerticesExist(
      Dictionary<string, ResponseJson.EdgeData> edges
    ) {
      this.edges = edges;
    }
  }

  public class EdgesBetweenVerticesResponseVerticesNonexistent : ModelInfoReqResponse {
    public readonly bool verticesExist = false;
    public readonly string[] requestNonexistentVertices;

    public EdgesBetweenVerticesResponseVerticesNonexistent(string[] nonexistentVertices) {
      this.requestNonexistentVertices = nonexistentVertices;
    }
  }

  public class FileIsOpenResponseNotOpen : ModelInfoReqResponse {
    public readonly bool fileIsOpen = false;
  }

  public class FileIsOpenResponseOpen : ModelInfoReqResponse {
    public readonly bool fileIsOpen = true;
    public readonly string fileName;
    public readonly bool fileIsUpToDate;

    public FileIsOpenResponseOpen(string fileName, bool fileIsUpToDate) {
      this.fileName = fileName;
      this.fileIsUpToDate = fileIsUpToDate;
    }
  }

  public class SavedFileNamesResponse : ModelInfoReqResponse {
    public readonly string[] fileNames;

    public SavedFileNamesResponse(string[] fileNames) {
      this.fileNames = fileNames;
    }
  }

  public class GetPortInfoResponseCouldFindPort : ModelInfoReqResponse {
    public readonly bool couldFindPort = true;
    public readonly string portValue;

    public GetPortInfoResponseCouldFindPort(string portValue) {
      this.portValue = portValue;
    }
  }

  public class GetPortInfoResponseCouldNotFindPort : ModelInfoReqResponse {
    public readonly bool couldFindPort = false;
  }

  public class GetLayerInfoResponseLayerExists : ModelInfoReqResponse {
    public readonly bool layerExists = true;
    public readonly ResponseJson.LayerData data;

    public GetLayerInfoResponseLayerExists(ResponseJson.LayerData data) {
      this.data = data;
    }
  }

  public class GetLayerInfoResponseLayerDoesNotExist : ModelInfoReqResponse {
    public readonly bool layerExists = false;
  }

  public class ValidateValueResponseNoError : ModelInfoReqResponse {
    public readonly string requestError = null;
    public readonly string fieldValidationError;

    public ValidateValueResponseNoError(string error) {
      this.fieldValidationError = error;
    }
  }

  public class ValidateValueResponseLayerNonexistentError : ModelInfoReqResponse {
    public readonly string requestError = "layer_nonexistent";
  }

  public class ValidateValueResponseFieldNonexistError : ModelInfoReqResponse {
    public readonly string requestError = "field_nonexistent";
    public readonly string fieldName;

    public ValidateValueResponseFieldNonexistError(string fieldName) {
      this.fieldName = fieldName;
    }
  }

  public class CompareValueResponseNoError : ModelInfoReqResponse {
    public readonly string requestError = null;
    public readonly bool isEqual;

    public CompareValueResponseNoError(bool isEqual) {
      this.isEqual = isEqual;
    }
  }

  public class CompareValueResponseLayerNonexistentError : ModelInfoReqResponse {
    public readonly string requestError = "layer_nonexistent";
  }

  public class CompareValueResponseFieldNonexistentError : ModelInfoReqResponse {
    public readonly string requestError = "field_nonexistent";
  }

  public class ValidateLayerFieldsResponseNoError : ModelInfoReqResponse {
    public readonly string requestError = null;
    public readonly string[] errors;
    public readonly string[] warnings;

    public ValidateLayerFieldsResponseNoError(string[] errors, string[] warnings) {
      this.errors = errors;
      this.warnings = warnings;
    }
  }

  public class ValidateLayerFieldsResponseLayerNonexistentError : ModelInfoReqResponse {
    public readonly string requestError = "layer_nonexistent";
  }

  public class ValidateLayerFieldsResponseFieldNonexistent : ModelInfoReqResponse {
    public readonly string requestError = "field_nonexistent";
    public readonly string fieldName;

    public ValidateLayerFieldsResponseFieldNonexistent(string fieldName) {
      this.fieldName = fieldName;
    }
  }

  public class GetUniqueEdgeIdsResponse : ModelInfoReqResponse {
    public readonly string[] edgeIds;

    public GetUniqueEdgeIdsResponse(string[] edgeIds) {
      this.edgeIds = edgeIds;
    }
  }

  public class UniqueVertexIdsResponse : ModelInfoReqResponse {
    public readonly string[] vertexIds;

    public UniqueVertexIdsResponse(string[] vertexIds) {
      this.vertexIds = vertexIds;
    }
  }

  public class ValueIsReadonlyResponseNotReadonly : ModelInfoReqResponse {
    public readonly string requestError = null;
    public readonly bool isReadonly = false;
  }

  public enum ReadonlyReason { port_is_occupied, value_is_not_modifiable }

  public class ValueIsReadonlyResponseIsReadonly : ModelInfoReqResponse {
    public readonly string requestError = null;
    public readonly bool isReadonly = true;

    [JsonConverter(typeof(StringEnumConverter))]
    public readonly ReadonlyReason reason;

    public ValueIsReadonlyResponseIsReadonly(ReadonlyReason reason) {
      this.reason = reason;
    }
  }

  public class GetGraphDataResponse : ModelInfoReqResponse {
    public readonly ResponseJson.GraphData data;

    public GetGraphDataResponse(ResponseJson.GraphData data) {
      this.data = data;
    }
  }
}
