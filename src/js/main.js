const connect_button = document.getElementById("accept");

const { ipcRenderer } = require('electron')

function transition_to_main (){
  document.getElementById("connectToDBPopUp").classList.add(["slide_out_down"])
  setTimeout(function(){
    dburi_vm.visible = false
    sidebar_vm.visible = true;
    document.getElementById("sidebar-1").classList.add(["slide_in_from_left"]);
    sidebar_vm.refresh();
  }, 800); 
}




const DBUri = {
  data () {
    return {
      visible: true,
      status: 'idle',
      error_message: "An Error Has Occured",
      uri: ""
    }
  },
  methods: {
    connectClicked(){
      this.status = 'pending'
      ipcRenderer.send('db_uri', document.getElementById("db_uri_input").value)
    }
  }
}

dburi_vm = Vue.createApp(DBUri).mount("#connectToDBPopUp")

ipcRenderer.on("db_uri", (event, data) => {
  console.log(data)
  if (data.status == 'err'){
    dburi_vm.error_message = data.message
    dburi_vm.status = 'err'
  } else if (data.status == "ok") {
    transition_to_main()
  }
})



const Sidebar = {
  data () {
    return {
      documents: [],
      collections: [],
      selected_document: null,
      selected_collection: null,
      collections_loading: true,
      documents_loading: true,
      visible: false
    }
  },
  methods: {
    refresh () {
      this.collections_loading = true;
      this.documents_loading = true;
      ipcRenderer.send('main', 'get_object');
    },
    requestDocuments(collection) {
      this.selected_collection = collection
      ipcRenderer.send("request_documents", collection)
    },
    editDocument(document){
      
      documentpanel_vm.documentData = document
      documentpanel_vm.collectionName = this.selected_collection;
      documentpanel_vm.state = 'edit'
      documentpanel_vm.visible = true;
    },
    newDocument() {
      var newDoc = Object.assign({}, this.documents[0]) // Use first document as template
      delete newDoc._id
      for(key of Object.keys(newDoc)){
        newDoc[key] = "";
      }
      console.log(newDoc);
      documentpanel_vm.documentData = newDoc;
      documentpanel_vm.collectionName = this.selected_collection;
      documentpanel_vm.state = 'new'
      documentpanel_vm.visible = true;
    }
  }
}

sidebar_vm = Vue.createApp(Sidebar).mount('#sidebar-1')
sidebar_vm.selected_document = "B"

const DocumentPanel =  {
  data() {
    return {
      documentData: {},
      collectionName: '',
      state: 'new',
      is_processing: false,
      visible: false,
      error_msg: ''
    }
  },
  methods: {
    saveDocument() {
      this.is_processing = true;
      ipcRenderer.send('modify',{
        type: this.state,
        collection: this.collectionName,
        data: JSON.parse(JSON.stringify(this.documentData))
      })
    },
    deleteDocument() {
      this.is_processing = true;
    }
  }
}

ipcRenderer.on('modify', (event, data) => {
  documentpanel_vm.is_processing = false;
  if (data.status == "ok"){
    this.error_msg = "Sucessfully Processed!"
  } else {
    this.error_msg = data.message
  }
})
documentpanel_vm = Vue.createApp(DocumentPanel).mount('#document_panel')


ipcRenderer.on('data_sync', (event, data) => {
  if (data["type"] == "collections"){ 
    sidebar_vm.collections = data["data"]
    sidebar_vm.collections_loading = false
  }if (data["type"] == "documents"){
    sidebar_vm.documents = data["data"]
    sidebar_vm.documents_loading = false
  }
})
