import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  AceEditorMode,
  DfAceEditorComponent,
} from 'src/app/shared/components/df-ace-editor/df-ace-editor.component';

@Component({
  selector: 'df-script-samples',
  templateUrl: './df-script-samples.component.html',
  styleUrls: ['./df-script-samples.component.scss'],
  standalone: true,
  imports: [MatSelectModule, DfAceEditorComponent, NgFor, MatFormFieldModule],
})
export class DfScriptSamplesComponent {
  samples: Array<{ label: string; mode: AceEditorMode; value: string }> = [
    {
      label: 'Node.js',
      mode: 'javascript',
      value: `//	Here are a few basic Node.js examples.
      //  See wiki.dreamfactory.com for more examples and Node.js setup info.
      //  console.log() can be used to log script output.

      //****************** Pre-processing script on a table ******************

      //	A script that is triggered by a POST on /api/v2/db/_table/<tablename>. Runs before the db call is made.
      //  The script validates that every record in the request has a value for the name field.

      console.log(event.request); // outputs to file in storage/log of dreamfactory install directory

      // use NPM to install lodash

      var lodash = require("lodash");

      if (event.request.payload.resource) { // use 'payload' for request
        lodash._.each(event.request.payload.resource, function( record ) {
        if (!record.name) {
          throw new Error('Name field is required');
        }
      });`,
    },
    {
      label: 'PHP',
      mode: 'php',
      value: `// Here are a few basic PHP examples.
      // See wiki.dreamfactory.com for more examples.

      // ****************** Pre-processing script on a table ******************

      //  A script that is triggered by a POST on /api/v2/db/_table/tablename. Runs before the db call is made.
      //  The script validates that every record in the request has a value for the name field.

      // use 'payload' for request
      $payload = $event['request']['payload'];

      if(!empty($payload['resource'])){
          foreach($payload['resource'] as $record){
              if(!array_key_exists('name', $record)){
                  throw new Exception('Name field is required');
              }
          }
      }

      // ****************** Post-processing script on a table ******************

      //  A script that is triggered by a GET on /api/v2/db/_table/tablename. Runs after the db call is made.
      //  The script adds a new field to each record in the response.
      //  To allow modification of response content, select checkbox in scripting tab of admin console.`,
    },
    {
      label: 'Python',
      mode: 'python',
      value: `# Here are a few basic Python examples.
      # Requires Bunch dictionary for dot notation, use PIP to install.
      # See wiki.dreamfactory.com for more examples.

      # ****************** Pre-processing script on a table ******************

      #  A script that is triggered by a POST on /api/v2/db/_table/<tablename>. Runs before the db call is made.
      #  The script validates that every record in the request has a value for the name field.

      # use 'payload' for request
      payload = event.request.payload;

      if(payload.resource):
          for record in payload.resource:
              if 'name' not in record:
                  raise ValueError('Name field is required');

      # ****************** Post-processing script on a table ******************

      #  A script that is triggered by a GET on /api/v2/db/_table/<tablename>. Runs after the db call is made.
      #  The script adds a new field to each record in the response.
      #  To allow modification of response content, select checkbox in scripting tab of admin console.

      # use 'content' for response
      content = event.response.content;`,
    },
  ];
  selectedSample = this.samples[0];
}
