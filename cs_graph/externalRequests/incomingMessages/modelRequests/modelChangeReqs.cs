using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelChangeRequests {
  public class InvalidInfoReqType : System.Exception {
    public InvalidInfoReqType(string message) : base(message) {}
  }

  public static class Dispatcher {
    public static void dispatch(
      ModelClassNS.ModelClass modelStruct,
      JObject jobj
    ) {
      string type = jobj["type"].ToString();

      if (type == "moveVertex") {
        MoveVertexReq.dispatch(modelStruct, jobj);
      } else if (type == "cloneVertex") {
        CloneVertexReq.dispatch(modelStruct, jobj);
      } else if (type == "createEdge") {
        CreateEdgeReq.dispatch(modelStruct, jobj);
      } else if (type == "deleteVertex") {
        DeleteVertexReq.dispatch(modelStruct, jobj);
      } else if (type == "deleteEdge") {
        DeleteEdgeReq.dispatch(modelStruct, jobj);
      } else if (type == "setLayerFields") {
        SetLayerFieldsReq.dispatch(modelStruct, jobj);
      } else {
        throw new InvalidInfoReqType(type);
      }
    }
  }

  internal static class MoveVertexReq {
    public static void dispatch(
      ModelClassNS.ModelClass modelStruct,
      JObject jobj
    ) {
      string vertexId = jobj["vertexId"].ToString();
      float x = float.Parse(jobj["x"].ToString());
      float y = float.Parse(jobj["y"].ToString());

      ModelUtilsNS.ModelUtils.moveVertex(
        modelStruct,
        vertexId,
        x,
        y
      );
    }
  }

  internal static class CloneVertexReq {
    public static void dispatch(
      ModelClassNS.ModelClass modelStruct,
      JObject jobj
    ) {
      string newVertexId = jobj["newVertexId"].ToString();
      string sourceVertexId = jobj["sourceVertexId"].ToString();
      float x = float.Parse(jobj["x"].ToString());
      float y = float.Parse(jobj["y"].ToString());

      ModelUtilsNS.ModelUtils.cloneVertex(modelStruct, sourceVertexId, newVertexId, x, y);
    }
  }

  internal static class CreateEdgeReq {
    public static void dispatch(
      ModelClassNS.ModelClass modelStruct,
      JObject jobj
    ) {
      string newEdgeId = jobj["newEdgeId"].ToString();
      string sourceVertexId = jobj["sourceVertexId"].ToString();
      string sourcePortId = jobj["sourcePortId"].ToString();
      string targetVertexId = jobj["targetVertexId"].ToString();
      string targetPortId = jobj["targetPortId"].ToString();

      ModelUtilsNS.ModelUtils.createEdge(
        modelStruct,
        newEdgeId,
        sourceVertexId,
        sourcePortId,
        targetVertexId,
        targetPortId
      );
    }
  }

  internal static class DeleteVertexReq {
    public static void dispatch(
      ModelClassNS.ModelClass modelStruct,
      JObject jobj
    ) {
      string vertexId = jobj["vertexId"].ToString();

      ModelUtilsNS.ModelUtils.deleteVertex(modelStruct, vertexId);
    }
  }

  internal static class DeleteEdgeReq {
    public static void dispatch(
      ModelClassNS.ModelClass modelStruct,
      JObject jobj
    ) {
      string edgeId = jobj["edgeId"].ToString();

      ModelUtilsNS.ModelUtils.deleteEdge(modelStruct, edgeId);
    }
  }

  internal static class SetLayerFieldsReq {
    public static void dispatch(
      ModelClassNS.ModelClass modelStruct,
      JObject jobj
    ) {
      Dictionary<string, string> fieldValues = new Dictionary<string, string>();

      foreach (var fieldEntry in (jobj["fieldValues"] as JObject).Properties()) {
        fieldValues[fieldEntry.Name] = fieldEntry.Value.ToString();
      }
      
      string layerId = jobj["layerId"].ToString();

      ModelUtilsNS.ModelUtils.setLayerFields(
        modelStruct,
        layerId,
        fieldValues
      );
    }
  }
}
#pragma warning restore 0649
