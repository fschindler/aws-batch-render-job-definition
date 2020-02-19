import * as core from '@actions/core'
import path from 'path'
import fs from 'fs'
import tmp from 'tmp'

async function run(): Promise<void> {
  try {
    // Get inputs
    const jobDefinitionFile = core.getInput('job-definition', {required: true})
    const imageURI = core.getInput('image', {required: true})

    // Parse the job definition
    const jobDefPath = path.isAbsolute(jobDefinitionFile)
      ? jobDefinitionFile
      : path.join(process.env.GITHUB_WORKSPACE || '', jobDefinitionFile)
    if (!fs.existsSync(jobDefPath)) {
      throw new Error(
        `Job definition file does not exist: ${jobDefinitionFile}`
      )
    }
    const buffer = fs.readFileSync(jobDefPath)
    const jobDefContents = JSON.parse(buffer.toString())

    // Insert the image URI
    if (
      typeof jobDefContents.containerProperties !== 'object' ||
      !jobDefContents.containerProperties.hasOwnProperty('image')
    ) {
      throw new Error(
        'Invalid job definition format: containerProperties section is not present, is not an object or has no property image'
      )
    }
    jobDefContents.containerProperties.image = imageURI

    // Write out a new task definition file
    const updatedJobDefFile = tmp.fileSync({
      dir: process.env.RUNNER_TEMP,
      prefix: 'job-definition-',
      postfix: '.json',
      keep: true,
      discardDescriptor: true
    })
    const newJobDefContents = JSON.stringify(jobDefContents, null, 2)
    fs.writeFileSync(updatedJobDefFile.name, newJobDefContents)
    core.setOutput('job-definition', updatedJobDefFile.name)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
