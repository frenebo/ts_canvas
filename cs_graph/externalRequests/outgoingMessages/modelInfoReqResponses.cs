using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.Collections.Generic;

namespace ModelInfoReqResponses {
  public abstract class ModelInfoReqResponse {
  }

  public abstract class ValidateEdgeResponse : ModelInfoReqResponse {
    public abstract bool valid {get;set;}
  }

  public class ValidateEdgeResponseValid : ValidateEdgeResponse {
    public override bool valid {get;set;} = true;
  }

  public class ValidateEdgeResponseInvalid : ValidateEdgeResponse {
    public override bool valid {get;set;} = false;
    public readonly string problem;

    public ValidateEdgeResponseInvalid(string problem) {
      this.problem = problem;
    }
  }

  public abstract class EdgesBetweenVerticesResponse : ModelInfoReqResponse {
    public abstract bool verticesExist {get;set;}
  }

  public class EdgesBetweenVerticesResponseVerticesExist : EdgesBetweenVerticesResponse {
    public override bool verticesExist {get;set;} = true;
    public readonly Dictionary<string, ResponseJson.EdgeData> edges;

    public EdgesBetweenVerticesResponseVerticesExist(
      Dictionary<string, ResponseJson.EdgeData> edges
    ) {
      this.edges = edges;
    }
  }

  public class EdgesBetweenVerticesResponseVerticesNonexistent : EdgesBetweenVerticesResponse {
    public override bool verticesExist {get;set;} = false;
    public readonly string[] requestNonexistentVertices;

    public EdgesBetweenVerticesResponseVerticesNonexistent(string[] nonexistentVertices) {
      this.requestNonexistentVertices = nonexistentVertices;
    }
  }

  public abstract class FileIsOpenResponse : ModelInfoReqResponse {
    public abstract bool fileIsOpen {get;set;}
  }

  public class FileIsOpenResponseNotOpen : FileIsOpenResponse {
    public override bool fileIsOpen {get;set;} = false;
  }

  public class FileIsOpenResponseOpen : FileIsOpenResponse {
    public override bool fileIsOpen {get;set;} = true;
    public readonly string fileName;
    public readonly bool fileIsUpToDate;

    public FileIsOpenResponseOpen(string fileName, bool fileIsUpToDate) {
      this.fileName = fileName;
      this.fileIsUpToDate = fileIsUpToDate;
    }
  }

  public class SavedFileNamesResponse : ModelInfoReqResponse {
    public readonly List<string> fileNames;

    public SavedFileNamesResponse(List<string> fileNames) {
      this.fileNames = fileNames;
    }
  }

  public abstract class GetPortInfoResponse : ModelInfoReqResponse {
    public abstract bool couldFindPort {get;set;}
  }

  public class GetPortInfoResponseCouldFindPort : GetPortInfoResponse {
    public override bool couldFindPort {get;set;} = true;
    public readonly string portValue;

    public GetPortInfoResponseCouldFindPort(string portValue) {
      this.portValue = portValue;
    }
  }

  public class GetPortInfoResponseCouldNotFindPort : GetPortInfoResponse {
    public override bool couldFindPort {get;set;} = false;
  }

  public abstract class GetLayerInfoResponse : ModelInfoReqResponse {
    public abstract bool layerExists {get;set;}
  }

  public class GetLayerInfoResponseLayerExists : GetLayerInfoResponse {
    public override bool layerExists {get;set;} = true;
    public readonly ResponseJson.LayerData data;

    public GetLayerInfoResponseLayerExists(ResponseJson.LayerData data) {
      this.data = data;
    }
  }

  public class GetLayerInfoResponseLayerDoesNotExist : GetLayerInfoResponse {
    public override bool layerExists {get;set;} = false;
  }

  public abstract class ValidateValueResponse : ModelInfoReqResponse {
    public abstract string requestError {get;set;}
  }

  public class ValidateValueResponseNoError : ValidateValueResponse {
    public override string requestError {get;set;} = null;
    public readonly string fieldValidationError;

    public ValidateValueResponseNoError(string error) {
      this.fieldValidationError = error;
    }
  }

  public class ValidateValueResponseLayerNonexistentError : ValidateValueResponse {
    public override string requestError {get;set;} = "layer_nonexistent";
  }

  public class ValidateValueResponseFieldNonexistError : ValidateValueResponse {
    public override string requestError {get;set;} = "field_nonexistent";
    public readonly string fieldName;

    public ValidateValueResponseFieldNonexistError(string fieldName) {
      this.fieldName = fieldName;
    }
  }

  public abstract class CompareValueResponse : ModelInfoReqResponse {
    public abstract string requestError {get;set;}
  }

  public class CompareValueResponseNoError : CompareValueResponse {
    public override string requestError {get;set;} = null;
    public readonly bool isEqual;

    public CompareValueResponseNoError(bool isEqual) {
      this.isEqual = isEqual;
    }
  }

  public class CompareValueResponseLayerNonexistentError : CompareValueResponse {
    public override string requestError {get;set;} = "layer_nonexistent";
  }

  public class CompareValueResponseFieldNonexistentError : CompareValueResponse {
    public override string requestError {get;set;} = "field_nonexistent";
  }

  public abstract class ValidateLayerFieldsResponse : ModelInfoReqResponse {
    public abstract string requestError {get;set;}
  }

  public class ValidateLayerFieldsResponseNoError : ValidateLayerFieldsResponse {
    public override string requestError {get;set;} = null;
    public readonly string[] errors;
    public readonly string[] warnings;

    public ValidateLayerFieldsResponseNoError(string[] errors, string[] warnings) {
      this.errors = errors;
      this.warnings = warnings;
    }
  }

  public class ValidateLayerFieldsResponseLayerNonexistentError : ValidateLayerFieldsResponse {
    public override string requestError {get;set;} = "layer_nonexistent";
  }

  public class ValidateLayerFieldsResponseFieldNonexistent : ValidateLayerFieldsResponse {
    public override string requestError {get;set;} = "field_nonexistent";
    public readonly string fieldName;

    public ValidateLayerFieldsResponseFieldNonexistent(string fieldName) {
      this.fieldName = fieldName;
    }
  }

  public class GetUniqueEdgeIdsResponse : ModelInfoReqResponse {
    public readonly List<string> edgeIds;

    public GetUniqueEdgeIdsResponse(List<string> edgeIds) {
      this.edgeIds = edgeIds;
    }
  }

  public class GetUniqueVertexIdsResponse : ModelInfoReqResponse {
    public readonly List<string> vertexIds;

    public GetUniqueVertexIdsResponse(List<string> vertexIds) {
      this.vertexIds = vertexIds;
    }
  }

  public abstract class ValueIsReadonlyResponse : ModelInfoReqResponse {
    public abstract string requestError {get;set;}
  }

  public class ValueIsReadonlyResponseNotReadonly : ValueIsReadonlyResponse {
    public override string requestError {get;set;} = null;
    public readonly bool isReadonly = false;
  }

  public enum ReadonlyReason { port_is_occupied, value_is_not_modifiable }

  public class ValueIsReadonlyResponseIsReadonly : ValueIsReadonlyResponse {
    public override string requestError {get;set;} = null;
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
