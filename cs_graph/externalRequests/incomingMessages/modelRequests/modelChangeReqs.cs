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
      ModelContainer.ModelContainer modelStruct,
      JObject jobj
    ) {
      string type = jobj["type"].ToString();

      if (type == "moveVertex") {
        MoveVertexReq.dispatch(modelStruct, jobj);
      } else if (type == "cloneVertex") {
        CloneVertexReq.dispatch(modelStruct, jobj);
      } else if (type == "createEdge") {
        CreateEdgeReq.dispatch(jobj);
      } else if (type == "deleteVertex") {
        DeleteEdgeReq.dispatch(jobj);
      } else if (type == "setLayerFields") {
        SetLayerFieldsReq.dispatch(jobj);
      } else {
        throw new InvalidInfoReqType(type);
      }
    }
  }

  internal struct GenericReq {
    public string type;
  }

  internal struct MoveVertexReq {
    public static void dispatch(
      ModelContainer.ModelContainer modelStruct,
      JObject jobj
    ) {
      MoveVertexReq moveVertexReq = new MoveVertexReq {
        vertexId = jobj["vertexId"].ToString(),
        x = float.Parse(jobj["x"].ToString()),
        y = float.Parse(jobj["y"].ToString())
      };

      ModelUtils.ModelUtils.moveVertex(
        modelStruct,
        moveVertexReq.vertexId,
        moveVertexReq.x,
        moveVertexReq.y
      );
    }

    public string vertexId;
    public float x;
    public float y;
  }

  internal struct CloneVertexReq {
    public static void dispatch(
      ModelContainer.ModelContainer modelStruct,
      JObject jobj
    ) {
      CloneVertexReq cloneVertexReq = new CloneVertexReq {
        newVertexId = jobj["newVertexId"].ToString(),
        sourceVertexId = jobj["sourceVertexId"].ToString(),
        x = float.Parse(jobj["x"].ToString()),
        y = float.Parse(jobj["y"].ToString())
      };

      ModelUtils.ModelUtils.cloneVertex(modelStruct, cloneVertexReq.sourceVertexId, cloneVertexReq.newVertexId, cloneVertexReq.x, cloneVertexReq.y);
    }

    public string newVertexId;
    public string sourceVertexId;
    public float x;
    public float y;
  }

  internal struct CreateEdgeReq {
    public static void dispatch(JObject jobj) {
      CreateEdgeReq createEdgeReq = new CreateEdgeReq {
        newEdgeId = jobj["newEdgeId"].ToString(),
        sourceVertexId = jobj["sourceVertexId"].ToString(),
        sourcePortId = jobj["sourcePortId"].ToString(),
        targetVertexId = jobj["targetVertexId"].ToString(),
        targetPortId = jobj["targetPortId"].ToString()
      };

      throw new System.Exception("CreateEdgeReq unimplemented");
    }

    public string newEdgeId;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  internal struct DeleteVertexReq {
    public static void dispatch(JObject jobj) {
      DeleteVertexReq deleteVertexReq = new DeleteVertexReq {
        vertexId = jobj["vertexId"].ToString()
      };

      throw new System.Exception("DeleteVertexReq unimplemented");
    }

    public string vertexId;
  }

  internal struct DeleteEdgeReq {
    public static void dispatch(JObject jobj) {
      DeleteEdgeReq deleteEdgeReq = new DeleteEdgeReq {
        edgeId = jobj["edgeId"].ToString()
      };

      throw new System.Exception("DeleteEdgeReq unimplemented");
    }

    public string edgeId;
  }

  internal struct SetLayerFieldsReq {
    public static void dispatch(JObject jobj) {
      Dictionary<string, string> fieldValues = new Dictionary<string, string>();

      foreach (var fieldEntry in (jobj["fieldValues"] as JObject).Properties()) {
        fieldValues[fieldEntry.Name] = fieldEntry.Value.ToString();
      }
      
      SetLayerFieldsReq setLayerFieldsReq = new SetLayerFieldsReq {
        layerId = jobj["layerId"].ToString(),
        fieldValues = fieldValues
      };

      throw new System.Exception("SetlayerFieldsReq unimplemented");
    }

    public string layerId;
    public Dictionary<string, string> fieldValues;
  }
}
#pragma warning restore 0649
